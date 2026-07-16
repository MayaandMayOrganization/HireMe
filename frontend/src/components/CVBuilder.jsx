import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import CVPreviewer from './CVPreviewer';

const DEFAULT_CV = {
  personalInfo: { fullName: '', email: '', phone: '', linkedin: '', github: '', summary: '' },
  education: [],
  experience: [],
  skills: [],
  projects: []
};

const CVBuilder = ({ onBack, onLogout }) => {
  const [cvData, setCvData] = useState(DEFAULT_CV);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Fetch saved CV on mount
  useEffect(() => {
    const loadSavedCV = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        const response = await fetch('/api/cv', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.cv) {
            setCvData(data.cv);
            if (data.cv.skills) {
              setSkillsInput(data.cv.skills.join(', '));
            }
          }
          if (data?.analysis) {
            setAnalysis(data.analysis);
          }
        }
      } catch (err) {
        console.error('Failed to load CV data:', err);
      }
    };
    loadSavedCV();
  }, []);

  // 2. Handle Scroll & Flash Outline from navigation parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      // Switch form tab to the highlighted section
      const tabMap = {
        'personal': 'personal',
        'education': 'education',
        'experience': 'experience',
        'skills': 'skills',
        'projects': 'projects'
      };
      if (tabMap[highlight]) {
        setActiveTab(tabMap[highlight]);
      }

      // Smooth scroll and outline flash
      setTimeout(() => {
        const element = document.getElementById(highlight);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('flash-outline');
          setTimeout(() => {
            element.classList.remove('flash-outline');
          }, 3000);
        }
      }, 600);
    }
  }, []);

  // 3. Auth Token retriever
  const getAuthHeaders = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
    } catch (err) {
      console.error('Failed to resolve auth session:', err);
      return { 'Content-Type': 'application/json' };
    }
  };

  // 4. Save Draft Request
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage('');
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/cv', {
        method: 'POST',
        headers,
        body: JSON.stringify(cvData)
      });
      if (response.ok) {
        setStatusMessage('Draft saved successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        throw new Error('Save draft failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving CV draft.');
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Trigger AI Analysis
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setStatusMessage('');
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/cv/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify(cvData)
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.analysis) {
          setAnalysis(result.analysis);
          setStatusMessage('AI Analysis complete!');
          setTimeout(() => setStatusMessage(''), 3000);
        }
      } else {
        throw new Error('AI analysis failed');
      }
    } catch (err) {
      console.error(err);
      alert('AI Reviewer experienced an issue. Fallback mock generated.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // State update helpers
  const updatePersonalInfo = (field, value) => {
    setCvData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const handleSkillsChange = (val) => {
    setSkillsInput(val);
    const cleaned = val.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    setCvData(prev => ({ ...prev, skills: cleaned }));
  };

  const addArrayItem = (key, itemTemplate) => {
    setCvData(prev => ({
      ...prev,
      [key]: [...prev[key], itemTemplate]
    }));
  };

  const updateArrayItem = (key, index, field, value) => {
    setCvData(prev => {
      const copy = [...prev[key]];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, [key]: copy };
    });
  };

  const removeArrayItem = (key, index) => {
    setCvData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, idx) => idx !== index)
    }));
  };

  return (
    <div className="min-h-screen text-[#e0e5f9] flex flex-col font-sans" style={{ backgroundColor: '#080e1c' }}>
      <style>{`
        .flash-outline {
          animation: pulse-border 1.5s 2 alternate;
          border-radius: 12px !important;
        }
        @keyframes pulse-border {
          0% {
            outline: 2px solid transparent;
            box-shadow: 0 0 0 transparent;
          }
          100% {
            outline: 3px solid #46eedd;
            box-shadow: 0 0 15px rgba(70, 238, 221, 0.4);
          }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-[#424858]/20 px-6 h-16 flex items-center justify-between bg-[#080e1c] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#a5abbd] hover:text-white hover:bg-[#1c2a41] transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Dashboard
          </button>
          <span className="text-xl font-black tracking-tighter text-[#46eedd]">HireMe CV Builder</span>
        </div>
        <div className="flex items-center gap-3">
          {statusMessage && (
            <span className="text-xs text-[#4ae183] font-bold animate-pulse">{statusMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 border border-[#424858]/40 hover:border-white rounded-lg text-xs font-bold transition-all uppercase tracking-wider disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-[#46eedd] text-[#080e1c] rounded-lg text-xs font-black transition-all hover:scale-105 uppercase tracking-wider disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-white"
            >
              Log out
            </button>
          )}
        </div>
      </header>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Input Form Editor */}
        <div className="w-1/2 flex flex-col border-r border-[#424858]/20 bg-[#0d1c32]">
          {/* Tab Selection */}
          <div className="flex border-b border-[#424858]/20 bg-[#041329] p-2 gap-1 overflow-x-auto hide-scrollbar">
            {[
              { id: 'personal', label: 'Personal Info', icon: 'person' },
              { id: 'experience', label: 'Experience', icon: 'work' },
              { id: 'education', label: 'Education', icon: 'school' },
              { id: 'projects', label: 'Projects', icon: 'code' },
              { id: 'skills', label: 'Skills', icon: 'star' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#1c2a41] text-[#46eedd] border-b-2 border-[#46eedd]'
                    : 'text-[#bacac6] hover:bg-[#1c2a41]/50 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* PERSONAL INFO */}
            {activeTab === 'personal' && (
              <fieldset id="personal" className="space-y-4 p-4 rounded-xl bg-[#041329] border border-[#3b4a47]/30 transition-all">
                <legend className="text-xs font-black uppercase text-[#46eedd] tracking-widest px-2">Personal Details</legend>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#bacac6] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={cvData.personalInfo?.fullName || ''}
                    onChange={e => updatePersonalInfo('fullName', e.target.value)}
                    className="w-full bg-[#080e1c] border border-[#3b4a47]/40 rounded-lg p-2.5 text-xs text-white focus:border-[#46eedd] outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#bacac6] mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={cvData.personalInfo?.email || ''}
                      onChange={e => updatePersonalInfo('email', e.target.value)}
                      className="w-full bg-[#080e1c] border border-[#3b4a47]/40 rounded-lg p-2.5 text-xs text-white focus:border-[#46eedd] outline-none"
                      placeholder="johndoe@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#bacac6] mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={cvData.personalInfo?.phone || ''}
                      onChange={e => updatePersonalInfo('phone', e.target.value)}
                      className="w-full bg-[#080e1c] border border-[#3b4a47]/40 rounded-lg p-2.5 text-xs text-white focus:border-[#46eedd] outline-none"
                      placeholder="050-1234567"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#bacac6] mb-1.5">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={cvData.personalInfo?.linkedin || ''}
                      onChange={e => updatePersonalInfo('linkedin', e.target.value)}
                      className="w-full bg-[#080e1c] border border-[#3b4a47]/40 rounded-lg p-2.5 text-xs text-white focus:border-[#46eedd] outline-none"
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#bacac6] mb-1.5">GitHub Profile</label>
                    <input
                      type="text"
                      value={cvData.personalInfo?.github || ''}
                      onChange={e => updatePersonalInfo('github', e.target.value)}
                      className="w-full bg-[#080e1c] border border-[#3b4a47]/40 rounded-lg p-2.5 text-xs text-white focus:border-[#46eedd] outline-none"
                      placeholder="github.com/username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#bacac6] mb-1.5">Professional Summary</label>
                  <textarea
                    rows={4}
                    value={cvData.personalInfo?.summary || ''}
                    onChange={e => updatePersonalInfo('summary', e.target.value)}
                    className="w-full bg-[#080e1c] border border-[#3b4a47]/40 rounded-lg p-2.5 text-xs text-white focus:border-[#46eedd] outline-none resize-none"
                    placeholder="Ambitious computer science student with a strong drive for software engineering..."
                  />
                </div>
              </fieldset>
            )}

            {/* EXPERIENCE */}
            {activeTab === 'experience' && (
              <fieldset id="experience" className="space-y-4 p-4 rounded-xl bg-[#041329] border border-[#3b4a47]/30 transition-all">
                <legend className="text-xs font-black uppercase text-[#46eedd] tracking-widest px-2">Work Experience</legend>
                {cvData.experience.map((exp, index) => (
                  <div key={index} className="p-4 bg-[#080e1c] border border-[#3b4a47]/30 rounded-lg relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('experience', index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-500 text-xs font-bold flex items-center"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={e => updateArrayItem('experience', index, 'company', e.target.value)}
                          className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Role</label>
                        <input
                          type="text"
                          value={exp.role || ''}
                          onChange={e => updateArrayItem('experience', index, 'role', e.target.value)}
                          className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Start Date</label>
                        <input
                          type="text"
                          placeholder="MM/YYYY"
                          value={exp.startDate || ''}
                          onChange={e => updateArrayItem('experience', index, 'startDate', e.target.value)}
                          className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">End Date</label>
                        <input
                          type="text"
                          placeholder="MM/YYYY or Present"
                          value={exp.endDate || ''}
                          onChange={e => updateArrayItem('experience', index, 'endDate', e.target.value)}
                          className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Description / Achievements</label>
                      <textarea
                        rows={3}
                        value={exp.description || ''}
                        onChange={e => updateArrayItem('experience', index, 'description', e.target.value)}
                        className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('experience', { company: '', role: '', startDate: '', endDate: '', description: '' })}
                  className="w-full py-2 border-2 border-dashed border-[#46eedd]/30 hover:border-[#46eedd]/75 rounded-lg text-xs font-bold text-[#46eedd] uppercase transition-all"
                >
                  + Add Experience
                </button>
              </fieldset>
            )}

            {/* EDUCATION */}
            {activeTab === 'education' && (
              <fieldset id="education" className="space-y-4 p-4 rounded-xl bg-[#041329] border border-[#3b4a47]/30 transition-all">
                <legend className="text-xs font-black uppercase text-[#46eedd] tracking-widest px-2">Education History</legend>
                {cvData.education.map((edu, index) => (
                  <div key={index} className="p-4 bg-[#080e1c] border border-[#3b4a47]/30 rounded-lg relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('education', index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-500 text-xs font-bold flex items-center"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Institution</label>
                      <input
                        type="text"
                        value={edu.institution || ''}
                        onChange={e => updateArrayItem('education', index, 'institution', e.target.value)}
                        className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Degree / Focus</label>
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={e => updateArrayItem('education', index, 'degree', e.target.value)}
                          className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">End Year</label>
                        <input
                          type="text"
                          placeholder="YYYY"
                          value={edu.endYear || ''}
                          onChange={e => updateArrayItem('education', index, 'endYear', e.target.value)}
                          className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('education', { institution: '', degree: '', startYear: '', endYear: '', description: '' })}
                  className="w-full py-2 border-2 border-dashed border-[#46eedd]/30 hover:border-[#46eedd]/75 rounded-lg text-xs font-bold text-[#46eedd] uppercase transition-all"
                >
                  + Add Education
                </button>
              </fieldset>
            )}

            {/* PROJECTS */}
            {activeTab === 'projects' && (
              <fieldset id="projects" className="space-y-4 p-4 rounded-xl bg-[#041329] border border-[#3b4a47]/30 transition-all">
                <legend className="text-xs font-black uppercase text-[#46eedd] tracking-widest px-2">Technical Projects</legend>
                {cvData.projects.map((proj, index) => (
                  <div key={index} className="p-4 bg-[#080e1c] border border-[#3b4a47]/30 rounded-lg relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('projects', index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-500 text-xs font-bold flex items-center"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Project Title</label>
                      <input
                        type="text"
                        value={proj.title || ''}
                        onChange={e => updateArrayItem('projects', index, 'title', e.target.value)}
                        className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Technologies Used (comma separated)</label>
                      <input
                        type="text"
                        placeholder="React, Node.js, Express"
                        value={proj.technologies ? proj.technologies.join(', ') : ''}
                        onChange={e => {
                          const list = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                          updateArrayItem('projects', index, 'technologies', list);
                        }}
                        className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-[#bacac6] mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={proj.description || ''}
                        onChange={e => updateArrayItem('projects', index, 'description', e.target.value)}
                        className="w-full bg-[#0d1c32] border border-[#3b4a47]/40 rounded p-2 text-xs text-white resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('projects', { title: '', technologies: [], description: '' })}
                  className="w-full py-2 border-2 border-dashed border-[#46eedd]/30 hover:border-[#46eedd]/75 rounded-lg text-xs font-bold text-[#46eedd] uppercase transition-all"
                >
                  + Add Project
                </button>
              </fieldset>
            )}

            {/* SKILLS */}
            {activeTab === 'skills' && (
              <fieldset id="skills" className="space-y-4 p-4 rounded-xl bg-[#041329] border border-[#3b4a47]/30 transition-all">
                <legend className="text-xs font-black uppercase text-[#46eedd] tracking-widest px-2">Skills & Technologies</legend>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#bacac6] mb-2">
                    Enter technical skills, languages, or tools (separated by commas)
                  </label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={e => handleSkillsChange(e.target.value)}
                    className="w-full bg-[#080e1c] border border-[#3b4a47]/40 rounded-lg p-2.5 text-xs text-white focus:border-[#46eedd] outline-none"
                    placeholder="Python, Java, JavaScript, AWS, Git"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {cvData.skills.map((skill, idx) => (
                      <span key={idx} className="bg-[#1c2a41] text-[#46eedd] px-2.5 py-1 rounded-full text-[10px] font-bold border border-[#46eedd]/10">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </fieldset>
            )}

          </div>
        </div>

        {/* Right Column: Live Preview & AI Feedback Panel */}
        <div className="w-1/2 flex flex-col bg-[#080e1c]">
          {/* Section Divider or Selector */}
          <div className="flex border-b border-[#424858]/20 bg-[#080e1c] px-6 h-12 items-center justify-between shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-[#a5abbd]">Live CV Preview</span>
            {analysis && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#a5abbd] uppercase">AI Review Score:</span>
                <span className="bg-[#4ae183]/15 text-[#4ae183] text-xs font-black px-2 py-0.5 rounded-full border border-[#4ae183]/20">
                  {analysis.score}/100
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
            {/* AI Review Drawer */}
            {analysis && (
              <div className="p-4 rounded-xl border border-[#3b4a47]/30 bg-[#041329] space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#46eedd]">AI Feedback Suggestions</h4>
                  {analysis.isMockFallback && (
                    <span className="text-[8px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                      MOCK FALLBACK ACTIVE
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {analysis.suggestions.map((s, idx) => (
                    <div key={idx} className="p-3 bg-[#080e1c] rounded-lg border-l-2 border-[#4ae183] text-[11px] leading-normal">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-black uppercase text-[#4ae183] bg-[#4ae183]/10 px-2 py-0.5 rounded-full">
                          {s.category}
                        </span>
                      </div>
                      <p className="text-[#e0e5f9] font-bold">{s.issue}</p>
                      <p className="text-[#a5abbd] mt-1 italic">Fix: {s.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Render */}
            <div className="p-1.5 bg-[#12192a] border border-[#424858]/30 rounded-xl max-w-[800px] mx-auto w-full">
              <CVPreviewer template="Classic" data={cvData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVBuilder;
