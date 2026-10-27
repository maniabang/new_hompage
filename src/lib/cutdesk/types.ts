export type CutSummary = {
  id: string;
  code: string;
  title: string;
  scene: string;
  status: string;
  duration: number;
  version: number;
  updated_at: string;
  updated_by: string;
  asset_count: number;
  episode_code: string;
  deleted_at: string | null;
};
export type Asset = {
  id: string;
  name: string;
  path: string;
  kind: string;
  role: string;
  checksum: string | null;
  selected: boolean;
  note: string;
  preview: string | null;
  object_key?: string | null;
};
export type Cut = CutSummary & {
  work_prompt: string;
  story: string;
  dialogue: string;
  prompt: string;
  prompt_draft: string;
  notes: string;
  assets: Asset[];
};
export type Episode = {
  id: string;
  code: string;
  title: string;
  count: number;
  reviewed: number;
};
export type Version = {
  id: number;
  version: number;
  actor: string;
  action: string;
  created_at: string;
  snapshot: Cut;
};
