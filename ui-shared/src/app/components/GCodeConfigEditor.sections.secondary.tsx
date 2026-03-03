import React from 'react';
import type { GCodeConfig } from '@dxf-fix/shared';
import { MicroJointSection } from './GCodeConfigEditor/components/MicroJointSection';

interface SecondarySectionsProps {
  selectedConfig: GCodeConfig;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  handleMicroJointChange: (
    field: keyof GCodeConfig['microJoint'],
    value: unknown,
  ) => void;
  handleConfigChange: (field: keyof GCodeConfig, value: unknown) => void;
}

export const GCodeConfigSecondarySections: React.FC<SecondarySectionsProps> = ({
  selectedConfig,
  expandedSections,
  toggleSection,
  handleMicroJointChange,
  handleConfigChange,
}) => (
  <>
    <section className={`config-section ${expandedSections.has('microjoint') ? 'expanded' : ''}`}>
      <div className="section-header" onClick={() => toggleSection('microjoint')}>
        <h3>微连配置</h3>
        <span className="toggle-icon">{expandedSections.has('microjoint') ? '▲' : '▼'}</span>
      </div>
      {expandedSections.has('microjoint') && (
        <MicroJointSection
          config={selectedConfig}
          onMicroJointChange={(field, value) =>
            handleMicroJointChange(field as keyof GCodeConfig['microJoint'], value)
          }
        />
      )}
    </section>

    <section className={`config-section ${expandedSections.has('template') ? 'expanded' : ''}`}>
      <div className="section-header" onClick={() => toggleSection('template')}>
        <h3>G代码模板</h3>
        <span className="toggle-icon">{expandedSections.has('template') ? '▲' : '▼'}</span>
      </div>
      {expandedSections.has('template') && (
        <div className="section-content">
          <label>
            G代码头:
            <textarea
              value={selectedConfig.headerTemplate}
              onChange={(event) => handleConfigChange('headerTemplate', event.target.value)}
              rows={4}
            />
          </label>
          <label>
            G代码尾:
            <textarea
              value={selectedConfig.footerTemplate}
              onChange={(event) => handleConfigChange('footerTemplate', event.target.value)}
              rows={4}
            />
          </label>
        </div>
      )}
    </section>
  </>
);
