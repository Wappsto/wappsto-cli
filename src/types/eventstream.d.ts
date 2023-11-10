import type { Application21 } from './application';
import type { Console21 } from './console';
import type { Request } from './custom';
import type { Extsync21 } from './extsync';
import type { Installation21 } from './installation';
import type { Notification21 } from './notification';

export interface Eventstream20 {
  path: string;
  event:
    | 'create'
    | 'update'
    | 'delete'
    | 'direct'
    | 'extsync'
    | 'console'
    | 'ready';
  data?:
    | {
        [k: string]: unknown;
      }
    | Notification21
    | Installation21
    | Application21
    | Console21
    | Extsync21
    | Request
    | string;
  meta_object: {
    id?: string;
    type: string;
    version: string;
    owner?: string;
  };
  timestamp?: string;
  type?: string;
  extra?: { output?: string };
  meta: Meta21;
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
    data?: {
      [k: string]: unknown;
    };
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
