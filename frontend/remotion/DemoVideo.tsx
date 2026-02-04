import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { IntroScene } from './Scenes/IntroScene';
import { FormCreationScene } from './Scenes/FormCreationScene';
import { AIAnalysisScene } from './Scenes/AIAnalysisScene';
import { EditingScene } from './Scenes/EditingScene';
import { QuestionTypesScene } from './Scenes/QuestionTypesScene';
import { OutroScene } from './Scenes/OutroScene';

export const DemoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene timing (in frames) - 41 seconds total @ 30fps = 1230 frames
  // Order: Intro → FormCreation → AIAnalysis (KEY) → Editing → QuestionTypes → Outro
  const introEnd = 4 * fps; // 0-4s (frames 0-120) - extra 1s for feature closeup
  const formCreationEnd = 12 * fps; // 4-12s (frames 120-360)
  const aiAnalysisEnd = 24 * fps; // 12-24s (frames 360-720) - 12 seconds for detail
  const editingEnd = 32 * fps; // 24-32s (frames 720-960)
  const questionTypesEnd = 37 * fps; // 32-37s (frames 960-1110)
  // Video ends at 41s (1230 frames)

  // Determine which scene to show
  let currentScene: React.ReactNode;
  let transitionOpacity = 1;

  if (frame < introEnd) {
    // Intro Scene (0-3s)
    currentScene = <IntroScene />;
    transitionOpacity = interpolate(
      frame,
      [introEnd - 15, introEnd],
      [1, 0],
      {
        easing: Easing.in(Easing.ease),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
  } else if (frame < formCreationEnd) {
    // Form Creation Scene (3-11s)
    currentScene = <FormCreationScene />;
    const fadeIn = interpolate(frame, [introEnd, introEnd + 15], [0, 1], { easing: Easing.out(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [formCreationEnd - 15, formCreationEnd], [1, 0], { easing: Easing.in(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    transitionOpacity = Math.min(fadeIn, fadeOut);
  } else if (frame < aiAnalysisEnd) {
    // AI Analysis Scene (11-23s) - KEY FEATURE with most time
    currentScene = <AIAnalysisScene />;
    const fadeIn = interpolate(frame, [formCreationEnd, formCreationEnd + 15], [0, 1], { easing: Easing.out(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [aiAnalysisEnd - 15, aiAnalysisEnd], [1, 0], { easing: Easing.in(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    transitionOpacity = Math.min(fadeIn, fadeOut);
  } else if (frame < editingEnd) {
    // Editing Scene (23-31s)
    currentScene = <EditingScene />;
    const fadeIn = interpolate(frame, [aiAnalysisEnd, aiAnalysisEnd + 15], [0, 1], { easing: Easing.out(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [editingEnd - 15, editingEnd], [1, 0], { easing: Easing.in(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    transitionOpacity = Math.min(fadeIn, fadeOut);
  } else if (frame < questionTypesEnd) {
    // Question Types Scene (31-36s)
    currentScene = <QuestionTypesScene />;
    const fadeIn = interpolate(frame, [editingEnd, editingEnd + 15], [0, 1], { easing: Easing.out(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [questionTypesEnd - 15, questionTypesEnd], [1, 0], { easing: Easing.in(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    transitionOpacity = Math.min(fadeIn, fadeOut);
  } else {
    // Outro Scene (36-40s)
    currentScene = <OutroScene />;
    transitionOpacity = interpolate(frame, [questionTypesEnd, questionTypesEnd + 15], [0, 1], { easing: Easing.out(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  return (
    <div style={{ flex: 1, width: '100%', height: '100%', opacity: transitionOpacity }}>
      {currentScene}
    </div>
  );
};
