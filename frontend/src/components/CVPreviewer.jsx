import React from 'react';

// Decoupled "Classic" template design
const ClassicTemplate = ({ data }) => {
  const { personalInfo, education = [], experience = [], skills = [], projects = [] } = data || {};

  return (
    <div className="bg-white text-[#1e293b] p-8 min-h-[842px] font-sans shadow-xl text-left text-xs leading-relaxed max-w-[800px] mx-auto border border-gray-200">
      {/* Header */}
      <div className="border-b-2 border-[#1c2a41] pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#041329] uppercase mb-1">
          {personalInfo?.fullName || 'Full Name'}
        </h1>
        <p className="text-sm font-semibold text-[#46eedd] mb-3">
          {personalInfo?.summary ? personalInfo.summary.split('.')[0] : 'Professional Profile'}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 font-mono">
          {personalInfo?.email && (
            <span className="flex items-center gap-1">
              Email: <span className="text-[#1e293b]">{personalInfo.email}</span>
            </span>
          )}
          {personalInfo?.phone && (
            <span className="flex items-center gap-1">
              Phone: <span className="text-[#1e293b]">{personalInfo.phone}</span>
            </span>
          )}
          {personalInfo?.linkedin && (
            <span className="flex items-center gap-1">
              LinkedIn: <span className="text-[#1e293b]">{personalInfo.linkedin}</span>
            </span>
          )}
          {personalInfo?.github && (
            <span className="flex items-center gap-1">
              GitHub: <span className="text-[#1e293b]">{personalInfo.github}</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo?.summary && (
        <div className="mb-6">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-[#041329] border-b border-gray-200 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-600 text-justify">{personalInfo.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-[#041329] border-b border-gray-200 pb-1 mb-2">
            Work Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="relative">
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>{exp.role || 'Role'} <span className="text-gray-400 font-normal">at</span> {exp.company || 'Company'}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{exp.startDate || 'Start'} – {exp.endDate || 'Present'}</span>
                </div>
                {exp.description && (
                  <p className="text-gray-600 mt-1 whitespace-pre-line">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-[#041329] border-b border-gray-200 pb-1 mb-2">
            Key Projects
          </h2>
          <div className="space-y-4">
            {projects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>{proj.title || 'Project Title'}</span>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <span className="text-[9px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {proj.technologies.join(', ')}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-gray-600 mt-1 whitespace-pre-line">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-[#041329] border-b border-gray-200 pb-1 mb-2">
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu, idx) => (
              <div key={idx}>
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>{edu.degree || 'Degree / Diploma'}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{edu.startYear || 'Start'} – {edu.endYear || 'End'}</span>
                </div>
                <div className="text-gray-500 text-[10px]">{edu.institution || 'School Name'}</div>
                {edu.description && (
                  <p className="text-gray-600 mt-1">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-wider text-[#041329] border-b border-gray-200 pb-1 mb-1">
            Skills & Competencies
          </h2>
          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="bg-gray-100 text-[#041329] px-2.5 py-1 rounded text-[10px] font-medium border border-gray-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CVPreviewer = ({ template = 'Classic', data }) => {
  switch (template) {
    case 'Classic':
    default:
      return <ClassicTemplate data={data} />;
  }
};

export default CVPreviewer;
