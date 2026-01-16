// Pact Template Definitions
// Pre-defined templates for common pact types

export type TemplateCategory = 'fitness' | 'health' | 'productivity' | 'creative' | 'custom';

export interface PactTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  suggestedFrequency: 'daily' | 'weekly' | 'custom';
  suggestedFrequencyDays?: number[]; // For custom frequency
  suggestedRoastLevel: 1 | 2 | 3;
  suggestedProofRequired: 'none' | 'optional' | 'required';
  suggestedPactType: 'individual' | 'group' | 'relay';
  isBuiltIn: boolean;
}

export interface UserTemplate extends PactTemplate {
  userId: string;
  createdAt: string;
}

export interface TemplateCategoryInfo {
  id: TemplateCategory;
  name: string;
  icon: string;
  color: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  { id: 'fitness', name: 'Fitness', icon: '\u{1F4AA}', color: '#FF6B35' },
  { id: 'health', name: 'Health', icon: '\u{1F49A}', color: '#2ECC71' },
  { id: 'productivity', name: 'Productivity', icon: '\u{1F4BC}', color: '#3498DB' },
  { id: 'creative', name: 'Creative', icon: '\u{1F3A8}', color: '#9B59B6' },
  { id: 'custom', name: 'My Templates', icon: '\u{2B50}', color: '#FF4D00' },
];

// Built-in fitness templates
const FITNESS_TEMPLATES: PactTemplate[] = [
  {
    id: 'gym',
    name: 'Hit the Gym',
    description: 'Get your workout in at the gym',
    icon: '\u{1F3CB}',
    category: 'fitness',
    suggestedFrequency: 'custom',
    suggestedFrequencyDays: [1, 3, 5], // Mon, Wed, Fri
    suggestedRoastLevel: 2,
    suggestedProofRequired: 'optional',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'run',
    name: 'Go for a Run',
    description: 'Get outside and run',
    icon: '\u{1F3C3}',
    category: 'fitness',
    suggestedFrequency: 'custom',
    suggestedFrequencyDays: [1, 3, 5], // Mon, Wed, Fri
    suggestedRoastLevel: 2,
    suggestedProofRequired: 'optional',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'workout',
    name: 'Daily Workout',
    description: 'Complete any workout of your choice',
    icon: '\u{1F4AA}',
    category: 'fitness',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 2,
    suggestedProofRequired: 'optional',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'steps',
    name: '10K Steps',
    description: 'Walk at least 10,000 steps',
    icon: '\u{1F6B6}',
    category: 'fitness',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 1,
    suggestedProofRequired: 'optional',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
];

// Built-in health templates
const HEALTH_TEMPLATES: PactTemplate[] = [
  {
    id: 'sleep',
    name: 'Sleep by 11 PM',
    description: 'Be in bed by 11 PM',
    icon: '\u{1F634}',
    category: 'health',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 2,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'water',
    name: 'Drink 8 Glasses',
    description: 'Stay hydrated with 8 glasses of water',
    icon: '\u{1F4A7}',
    category: 'health',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 1,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'meditation',
    name: 'Meditate',
    description: 'Practice mindfulness or meditation',
    icon: '\u{1F9D8}',
    category: 'health',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 1,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'no-alcohol',
    name: 'No Alcohol',
    description: 'Stay alcohol-free for the day',
    icon: '\u{1F6AB}',
    category: 'health',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 3,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
];

// Built-in productivity templates
const PRODUCTIVITY_TEMPLATES: PactTemplate[] = [
  {
    id: 'read',
    name: 'Read Daily',
    description: 'Read for at least 30 minutes',
    icon: '\u{1F4D6}',
    category: 'productivity',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 1,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'study',
    name: 'Study Session',
    description: 'Complete a focused study session',
    icon: '\u{1F4DA}',
    category: 'productivity',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 2,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'no-social-media',
    name: 'No Social Media',
    description: 'Stay off social media all day',
    icon: '\u{1F4F5}',
    category: 'productivity',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 3,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'wake-early',
    name: 'Wake Up Early',
    description: 'Wake up before 7 AM',
    icon: '\u{23F0}',
    category: 'productivity',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 2,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
];

// Built-in creative templates
const CREATIVE_TEMPLATES: PactTemplate[] = [
  {
    id: 'write',
    name: 'Write Daily',
    description: 'Write for at least 30 minutes or 500 words',
    icon: '\u{270D}',
    category: 'creative',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 1,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'draw',
    name: 'Sketch Something',
    description: 'Draw or sketch something every day',
    icon: '\u{1F58C}',
    category: 'creative',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 1,
    suggestedProofRequired: 'optional',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'practice-instrument',
    name: 'Practice Instrument',
    description: 'Practice your musical instrument',
    icon: '\u{1F3B8}',
    category: 'creative',
    suggestedFrequency: 'daily',
    suggestedRoastLevel: 2,
    suggestedProofRequired: 'none',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
  {
    id: 'create-content',
    name: 'Create Content',
    description: 'Create and post content online',
    icon: '\u{1F3AC}',
    category: 'creative',
    suggestedFrequency: 'weekly',
    suggestedRoastLevel: 2,
    suggestedProofRequired: 'required',
    suggestedPactType: 'individual',
    isBuiltIn: true,
  },
];

// All built-in templates combined
export const BUILT_IN_TEMPLATES: PactTemplate[] = [
  ...FITNESS_TEMPLATES,
  ...HEALTH_TEMPLATES,
  ...PRODUCTIVITY_TEMPLATES,
  ...CREATIVE_TEMPLATES,
];

// Helper functions
export function getTemplatesByCategory(category: TemplateCategory): PactTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): PactTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

export function getCategoryInfo(category: TemplateCategory): TemplateCategoryInfo | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === category);
}
