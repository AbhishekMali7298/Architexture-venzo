'use client';

import { useState } from 'react';
import type { ImageAdjustments } from '@textura/shared';
import {
  CheckboxField,
  ColorField,
  NumberField,
  RangeField,
  SectionCard,
  SelectField,
  SliderField,
} from './field-controls';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';



export function MaterialSettingsSection({
  materialName,
  materialCategory,
  materialColor,
  materialThumbnailUrl,
  jointMaterialName,
  jointMaterialThumbnailUrl,
  width,
  height,
  jointHorizontal,
  jointVertical,
  jointAdjustments,
  units,
  linkedJoints,
  onOpenPicker,
  onOpenJointMaterialPicker,
  onWidthChange,
  onHeightChange,
  onJointHorizontalChange,
  onJointVerticalChange,
  onJointAdjustmentChange,
  onLinkedJointsChange,
  embossMode,
  embossStrength,
  embossAvailable = true,
  onEmbossModeChange,
  onEmbossStrengthChange,
  embossIntensity,
  embossDepth,
  onEmbossIntensityChange,
  onEmbossDepthChange,
  isImpressPattern = false,
}: {
  materialName: string;
  materialCategory: string;
  materialColor: string;
  materialThumbnailUrl?: string | null;
  jointMaterialName: string;
  jointMaterialThumbnailUrl?: string | null;
  width: number;
  height: number;
  jointHorizontal: number;
  jointVertical: number;
  jointAdjustments: ImageAdjustments;
  units: 'mm' | 'inches';
  linkedJoints: boolean;

  embossMode: boolean;
  embossStrength: number;
  embossAvailable?: boolean;
  onOpenPicker: () => void;
  onOpenJointMaterialPicker: () => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onJointHorizontalChange: (value: number) => void;
  onJointVerticalChange: (value: number) => void;
  onJointAdjustmentChange: (key: keyof ImageAdjustments, value: number | boolean) => void;
  onLinkedJointsChange: (value: boolean) => void;

  onEmbossModeChange: (value: boolean) => void;
  onEmbossStrengthChange: (value: number) => void;
  embossIntensity: number;
  embossDepth: number;
  onEmbossIntensityChange: (value: number) => void;
  onEmbossDepthChange: (value: number) => void;
  isImpressPattern?: boolean;
}) {

  const [showJointAdjustments, setShowJointAdjustments] = useState(false);


  const unitLabel = units === 'inches' ? 'in' : 'mm';

  return (
    <>
      <SectionCard title="Material">
        <button
          className={`${styles.selectionButton} ${styles.selectionButtonCompact}`}
          type="button"
          onClick={onOpenPicker}
        >
          <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
            <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>
              {materialName}
            </span>
            <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>
              {materialCategory}
            </span>
          </span>
          <MaterialThumb
            color={materialColor}
            src={materialThumbnailUrl}
            alt={materialName}
            size={36}
            compact
            shape="square"
            loading="eager"
          />
        </button>

        {embossAvailable ? (
          <>
            <RangeField
              label="Emboss Strength"
              value={embossStrength}
              min={0}
              max={100}
              step={5}
              valueText={`${embossStrength}%`}
              onChange={onEmbossStrengthChange}
            />
            <div className={styles.gridTwo}>
              <RangeField
                label="Intensity"
                value={embossIntensity}
                min={0}
                max={100}
                step={5}
                valueText={`${embossIntensity}%`}
                onChange={onEmbossIntensityChange}
              />
              <RangeField
                label="Depth"
                value={embossDepth}
                min={0}
                max={100}
                step={5}
                valueText={`${embossDepth}%`}
                onChange={onEmbossDepthChange}
              />
            </div>
          </>
        ) : null}

        <div className={styles.gridTwo}>
          <NumberField
            label="Width"
            value={width}
            min={1}
            max={5000}
            unit={unitLabel}
            onChange={onWidthChange}
          />
          <NumberField
            label="Height"
            value={height}
            min={1}
            max={5000}
            unit={unitLabel}
            onChange={onHeightChange}
          />
        </div>



        <div className={styles.subsectionTitle}>Joints</div>

            <button
              className={`${styles.selectionButton} ${styles.selectionButtonCompact}`}
              type="button"
              onClick={onOpenJointMaterialPicker}
            >
              <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
                <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>
                  {jointMaterialName}
                </span>
                <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>
                  Joint material
                </span>
              </span>
              <MaterialThumb
                color="#FFFFFF"
                src={jointMaterialThumbnailUrl}
                alt={jointMaterialName}
                size={36}
                compact
                shape="circle"
                loading="eager"
              />
            </button>

            <div className={styles.jointDimensionRow}>
              <NumberField
                label="H Joint"
                value={jointHorizontal}
                min={-500}
                max={500}
                unit={unitLabel}
                onChange={onJointHorizontalChange}
              />
              <button
                className={`${styles.jointLinkButton} ${linkedJoints ? styles.jointLinkButtonActive : ''}`}
                type="button"
                onClick={() => onLinkedJointsChange(!linkedJoints)}
                aria-label={linkedJoints ? 'Unlock joint sizes' : 'Link joint sizes'}
                title={linkedJoints ? 'Click to unlink joints' : 'Click to link joints'}
              >
                {linkedJoints ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                )}
              </button>
              <NumberField
                label="V Joint"
                value={jointVertical}
                min={-500}
                max={500}
                unit={unitLabel}
                onChange={onJointVerticalChange}
              />
            </div>
      </SectionCard>



      {showJointAdjustments ? (
        <Modal onClose={() => setShowJointAdjustments(false)}>
          <div className={styles.settingsModalCard}>
            <div className={styles.settingsModalHeader}>
              <h3 className={styles.settingsModalTitle}>Joint Adjustments</h3>
              <button
                className={styles.settingsCloseButton}
                type="button"
                onClick={() => setShowJointAdjustments(false)}
                aria-label="Close joint adjustments"
              >
                ✕
              </button>
            </div>

            <div className={styles.adjustmentsPanel}>
              <SliderField
                label="Brightness"
                value={jointAdjustments.brightness}
                min={-100}
                max={100}
                onChange={(value) => onJointAdjustmentChange('brightness', value)}
                onReset={() => onJointAdjustmentChange('brightness', 0)}
              />
              <SliderField
                label="Contrast"
                value={jointAdjustments.contrast}
                min={-100}
                max={100}
                onChange={(value) => onJointAdjustmentChange('contrast', value)}
                onReset={() => onJointAdjustmentChange('contrast', 0)}
              />
              <SliderField
                label="Hue"
                value={jointAdjustments.hue}
                min={-180}
                max={180}
                onChange={(value) => onJointAdjustmentChange('hue', value)}
                onReset={() => onJointAdjustmentChange('hue', 0)}
              />
              <SliderField
                label="Saturation"
                value={jointAdjustments.saturation}
                min={-100}
                max={100}
                onChange={(value) => onJointAdjustmentChange('saturation', value)}
                onReset={() => onJointAdjustmentChange('saturation', 0)}
              />
              <CheckboxField
                label="Invert Colors"
                checked={jointAdjustments.invertColors}
                onChange={(checked) => onJointAdjustmentChange('invertColors', checked)}
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
