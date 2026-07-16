import base64
import json
import os
import urllib.request
import boto3
import jwt

# CORS headers required for API Gateway / Lambda Function URL response
CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
}

COGNITO_JWKS = None

def get_cognito_jwks(region, user_pool_id):
    """Fetch and cache Cognito JWKS keys."""
    global COGNITO_JWKS
    if COGNITO_JWKS is not None:
        return COGNITO_JWKS
    url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
    try:
        with urllib.request.urlopen(url) as response:
            COGNITO_JWKS = json.loads(response.read().decode("utf-8"))
        return COGNITO_JWKS
    except Exception as e:
        print(f"Error fetching JWKS from Cognito: {e}")
        raise ValueError(f"Failed to fetch Cognito public keys: {e}")

def validate_cognito_token(token, region, user_pool_id):
    """Decode and validate Cognito JWT using RS256 algorithm and public JWKS."""
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as e:
        raise ValueError(f"Invalid token format: {e}")
        
    kid = unverified_header.get("kid")
    if not kid:
        raise ValueError("Token header missing 'kid'")
        
    jwks = get_cognito_jwks(region, user_pool_id)
    public_key_jwk = None
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            public_key_jwk = key
            break
            
    if not public_key_jwk:
        raise ValueError("Public key not found in JWKS")
        
    try:
        # Build the public key object from JWK parameters
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(public_key_jwk)
    except Exception as e:
        raise ValueError(f"Failed to load public key: {e}")
        
    issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"
    try:
        # Decode & Verify token signature, expiration, and issuer
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False}  # Support both access token & ID token structures
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token signature or claims: {e}")

def extract_token(event) -> str:
    """Extract Authorization bearer token from Lambda request headers."""
    headers = event.get("headers") or {}
    auth_header = None
    for k, v in headers.items():
        if k.lower() == "authorization":
            auth_header = v
            break
            
    if not auth_header:
        raise ValueError("Authorization header is missing")
        
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return auth_header.strip()

def get_username_from_payload(payload: dict) -> str:
    """Extract username matching Cognito username conventions used in DynamoDB."""
    email = payload.get("email") or ""
    if email and "@" in email:
        return email.split("@")[0]
    return payload.get("username") or payload.get("cognito:username") or payload.get("sub") or "user"

def lambda_handler(event, context):
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or "GET"
    )

    # Handle Preflight OPTIONS request
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": ""
        }

    try:
        # 1. Parse configuration parameters
        region = os.environ.get("AWS_REGION", "us-east-1")
        user_pool_id = os.environ.get("COGNITO_USER_POOL_ID", "us-east-1_u56lBJUdL")
        table_name = os.environ.get("DYNAMODB_TABLE", "HireMe_Table")

        # 2. Extract and validate Cognito JWT Token
        token = extract_token(event)
        payload = validate_cognito_token(token, region, user_pool_id)
        username = get_username_from_payload(payload)

        dynamodb = boto3.resource("dynamodb", region_name=region)
        table = dynamodb.Table(table_name)

        path = event.get("rawPath") or event.get("path") or ""
        is_analyze_path = path.endswith("/analyze")

        # --- GET: Fetch saved CV and Analysis ---
        if method == "GET":
            response = table.get_item(
                Key={
                    "userId": username,
                    "sortKey": "cv"
                }
            )
            item = response.get("Item") or {}
            
            # Extract CV and analysis, default to None if not present
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({
                    "cv": item.get("cv"),
                    "analysis": item.get("analysis")
                })
            }

        # --- POST: Save and optionally Analyze CV ---
        elif method == "POST":
            # Parse body
            body_str = event.get("body") or ""
            if event.get("isBase64Encoded"):
                body_str = base64.b64decode(body_str).decode("utf-8")
            
            cv_data = json.loads(body_str) if body_str else {}
            if not cv_data:
                return {
                    "statusCode": 400,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Empty or invalid CV body data"})
                }

            # Fetch existing analysis if not doing a new analysis, so we preserve it
            existing_analysis = None
            if not is_analyze_path:
                try:
                    existing_response = table.get_item(
                        Key={
                            "userId": username,
                            "sortKey": "cv"
                        }
                    )
                    existing_item = existing_response.get("Item") or {}
                    existing_analysis = existing_item.get("analysis")
                except Exception:
                    pass

            # Setup basic structure to save
            db_item = {
                "userId": username,
                "sortKey": "cv",
                "cv": cv_data,
                "analysis": existing_analysis
            }

            if is_analyze_path:
                # Stubbed AI analysis logic for Step 1
                # This will be integrated with real OpenAI completion calls in Step 2
                analysis_feedback = {
                    "score": 78,
                    "strengths": [
                        "Nicely structured sections",
                        "Relevant modern technology selections"
                    ],
                    "suggestions": [
                        {
                            "category": "experience",
                            "issue": "Include action verbs and metrics in experience listings.",
                            "fix": "Rewrite details focusing on quantifiable outcomes."
                        }
                    ]
                }
                db_item["analysis"] = analysis_feedback

            # Put item in DynamoDB
            table.put_item(Item=db_item)

            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({
                    "success": True,
                    "cv": db_item["cv"],
                    "analysis": db_item["analysis"]
                })
            }

        else:
            return {
                "statusCode": 405,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Method Not Allowed"})
            }

    except ValueError as val_err:
        print(f"Validation failure: {val_err}")
        return {
            "statusCode": 401,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(val_err)})
        }
    except Exception as exc:
        print(f"Server error: {exc}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Internal Server Error: {str(exc)}"})
        }
