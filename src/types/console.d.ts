export interface Console21 {
  meta: Meta21;
  log?: string;
  warn?: string;
  error?: string;
  type: string;
  timestamp: string;
}

export interface Meta21 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ('unassigned' | 'admin')) & string;
  owner?: (string | ('unassigned' | 'admin')) & string;
  created?: (string | 'not_available') & string;
  updated?: (string | 'not_available') & string;
  application?: string;
  installation?: string;
  revision?: number;
  trace?: string;
  oem?: string;
  deprecated?: boolean;
  redirect?: string;
  size?: number;
  path?: string;
  parent?: string;
  error?: {
    [k: string]: unknown;
  };
  icon?: string;
  tag?: string[];
  tag_by_user?: string[];
  name_by_user?: string;
  warning?: {
    message?: string;
    data?: Record<string, any>;
    code?: number;
    [k: string]: unknown;
  }[];
  parent_name?: {
    [k: string]: unknown;
  };
  read_only?: boolean;
  original_id?: string;
  alert?: string[];
}
