import React from 'react';

// 1. Classic Resume Template
const ClassicTemplate = ({ data, accentColor }) => {
  const { personalInfo, education = [], experience = [], skills = [], projects = [] } = data || {};

  return (
    <div className="bg-white text-[#1e293b] p-8 min-h-[842px] font-sans shadow-xl text-left text-xs leading-relaxed max-w-[800px] mx-auto border border-gray-200">
      {/* Header */}
      <div className="pb-4 mb-6 border-b-2" style={{ borderColor: accentColor }}>
        <h1 className="text-2xl font-bold tracking-tight text-[#041329] uppercase mb-1">
          {personalInfo?.fullName || 'Full Name'}
        </h1>
        <p className="text-sm font-semibold mb-3" style={{ color: accentColor }}>
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

// 2. Modern Resume Template (Sidebar Column Layout)
const ModernTemplate = ({ data, accentColor }) => {
  const { personalInfo, education = [], experience = [], skills = [], projects = [] } = data || {};

  return (
    <div className="bg-white text-[#334155] min-h-[842px] font-sans shadow-xl text-left text-xs leading-relaxed max-w-[800px] mx-auto border border-gray-200 grid grid-cols-12">
      {/* Left Sidebar */}
      <div className="col-span-4 bg-[#0f172a] text-[#f1f5f9] p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-3 text-white" style={{ backgroundColor: accentColor }}>
            {personalInfo?.fullName ? (personalInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase()) : 'CV'}
          </div>
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            {personalInfo?.fullName || 'Full Name'}
          </h2>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: accentColor }}>Candidate</span>
        </div>

        {/* Contact info details */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-1.5 mb-2.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Contact</h3>
          <ul className="space-y-2 text-[9px] font-mono text-slate-300">
            {personalInfo?.email && <li className="break-all">✉ {personalInfo.email}</li>}
            {personalInfo?.phone && <li>☎ {personalInfo.phone}</li>}
            {personalInfo?.linkedin && <li className="break-all">🔗 {personalInfo.linkedin}</li>}
            {personalInfo?.github && <li className="break-all">💻 {personalInfo.github}</li>}
          </ul>
        </div>

        {/* Skills pill items */}
        {skills && skills.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-1.5 mb-2.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span key={idx} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[9px] font-medium border border-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column main info */}
      <div className="col-span-8 p-8 bg-slate-50 flex flex-col gap-6">
        {personalInfo?.summary && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#0f172a] border-b-2 border-slate-200 pb-1 mb-2">Profile Summary</h3>
            <p className="text-slate-600 text-justify leading-relaxed">{personalInfo.summary}</p>
          </div>
        )}

        {experience && experience.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#0f172a] border-b-2 border-slate-200 pb-1 mb-3">Experience</h3>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 pl-3 py-0.5" style={{ borderColor: accentColor }}>
                  <div className="flex justify-between font-bold text-slate-850">
                    <span>{exp.role || 'Role'} <span className="text-slate-400 font-normal">at</span> {exp.company || 'Company'}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{exp.startDate || 'Start'} – {exp.endDate || 'Present'}</span>
                  </div>
                  {exp.description && <p className="text-slate-600 mt-1 whitespace-pre-line">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#0f172a] border-b-2 border-slate-200 pb-1 mb-3">Key Projects</h3>
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-slate-850">
                    <span>{proj.title || 'Project'}</span>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="text-[9px] font-mono font-bold" style={{ color: accentColor }}>
                        [{proj.technologies.join(', ')}]
                      </span>
                    )}
                  </div>
                  {proj.description && <p className="text-slate-600 mt-1 whitespace-pre-line">{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {education && education.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#0f172a] border-b-2 border-slate-200 pb-1 mb-2">Education</h3>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-slate-855">
                    <span>{edu.degree || 'Degree'}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{edu.endYear}</span>
                  </div>
                  <div className="text-slate-500 text-[10px] font-medium">{edu.institution}</div>
                  {edu.description && <p className="text-slate-500 mt-1 text-[10px]">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Creative Resume Template (Top Header with visual colors & grid)
const CreativeTemplate = ({ data, accentColor }) => {
  const { personalInfo, education = [], experience = [], skills = [], projects = [] } = data || {};

  return (
    <div className="bg-white text-[#475569] p-8 min-h-[842px] font-sans shadow-xl text-left text-xs leading-relaxed max-w-[800px] mx-auto relative border-t-8" style={{ borderTopColor: accentColor }}>
      {/* Top Header Card */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
            {personalInfo?.fullName || 'Full Name'}
          </h1>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>
            {personalInfo?.summary ? personalInfo.summary.split('.')[0] : 'Creative Professional'}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-[9px] font-semibold text-slate-500">
          {personalInfo?.email && <span>✉ {personalInfo.email}</span>}
          {personalInfo?.phone && <span>☎ {personalInfo.phone}</span>}
          {personalInfo?.linkedin && <span>🔗 {personalInfo.linkedin}</span>}
          {personalInfo?.github && <span>💻 {personalInfo.github}</span>}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column content details */}
        <div className="md:col-span-2 space-y-6">
          {personalInfo?.summary && (
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-l-4 pl-2 mb-2" style={{ borderColor: accentColor }}>About Me</h2>
              <p className="text-slate-600 text-justify">{personalInfo.summary}</p>
            </div>
          )}

          {experience && experience.length > 0 && (
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-l-4 pl-2 mb-3" style={{ borderColor: accentColor }}>Work History</h2>
              <div className="space-y-4">
                {experience.map((exp, idx) => (
                  <div key={idx} className="relative pl-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{exp.role} <span style={{ color: accentColor }}>@</span> {exp.company}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && <p className="text-slate-600 mt-1 whitespace-pre-line">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-l-4 pl-2 mb-3" style={{ borderColor: accentColor }}>Key Projects</h2>
              <div className="space-y-4">
                {projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{proj.title}</span>
                      <span className="text-[8px] font-mono px-2 py-0.5 rounded-full border" style={{ backgroundColor: `${accentColor}10`, color: accentColor, borderColor: `${accentColor}30` }}>
                        Project
                      </span>
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {proj.technologies.map((tech, tIdx) => (
                          <span key={tIdx} className="text-[8px] font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded">{tech}</span>
                        ))}
                      </div>
                    )}
                    {proj.description && <p className="text-slate-600 mt-1.5 whitespace-pre-line">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column sidebar details */}
        <div className="space-y-6">
          {skills && skills.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-l-4 pl-2 mb-3" style={{ borderColor: accentColor }}>Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <span key={idx} className="bg-white text-slate-800 shadow-sm border border-slate-200/60 px-2.5 py-0.5 rounded-full text-[9px] font-bold transition-all border-transparent hover:border-blue-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {education && education.length > 0 && (
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-l-4 pl-2 mb-3" style={{ borderColor: accentColor }}>Education</h2>
              <div className="space-y-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 text-[11px]">{edu.degree}</div>
                    <div className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: accentColor }}>{edu.institution}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-1">{edu.endYear}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CVPreviewer = ({ theme = 'classic', accentColor = '#3b82f6', data }) => {
  const activeTheme = (theme || 'classic').toLowerCase().trim();
  switch (activeTheme) {
    case 'modern':
      return <ModernTemplate data={data} accentColor={accentColor} />;
    case 'creative':
      return <CreativeTemplate data={data} accentColor={accentColor} />;
    case 'classic':
    default:
      return <ClassicTemplate data={data} accentColor={accentColor} />;
  }
};

export default CVPreviewer;
