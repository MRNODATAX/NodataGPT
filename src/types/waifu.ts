export type WaifuArchetype =
  | 'dandere'
  | 'tsundere'
  | 'kuudere'
  | 'deredere'
  | 'oneesan'
  | 'custom';

export type WaifuMoodId = 'shy' | 'happy' | 'pout' | 'focused' | 'warm';

export interface WaifuMoodState {
  id: WaifuMoodId;
  label: string;
  affectionLevel: number; // 1..5
  affectionLabel: string;
  affectionProgress: number; // 0..100
}

export interface WaifuScenarioPreset {
  id: string;
  title: string;
  scenario: string;
  firstMessage: string;
}

export interface WaifuProfile {
  id: string;
  name: string;
  animeSource: string;
  tagline: string;
  avatarUrl: string;
  archetype: WaifuArchetype;
  personality: string;
  speechStyle: string;
  likesAndQuirks: string;
  scenario: string;
  firstMessage: string;
  scenarioPresets: WaifuScenarioPreset[];
  exampleDialogue: string;
  userNickname: string;
  userRole: string;
  affectionMeterEnabled: boolean;
  isBuiltInDefault?: boolean;
  updatedAt: number;
}

export interface WaifuStoreState {
  activeWaifuId: string;
  profiles: WaifuProfile[];
}

export interface TavernCharacterCardV2 {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    alternate_greetings?: string[];
    tags?: string[];
    creator?: string;
    character_version?: string;
    extensions?: Record<string, unknown>;
  };
}
