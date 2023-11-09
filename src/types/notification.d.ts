import { JsonObjType } from './custom';

export interface Notification21 {
  read: 'read' | 'unread' | 'accepted' | 'denied' | 'deleted';
  custom?: JsonObjType;
  base: {
    action?: string;
    code?: number;
    from?: string | 'admin';
    to?: string;
    from_type?: string;
    from_name?: string;
    to_type?: string;
    type_ids?: string;
    prev_notification?: string;
    priority?: number;
    ids?: string[];
    info?: {
      id?: string;
      type?: string;
      name?: string;
      [k: string]: string;
    }[];
    type?:
      | 'admin'
      | 'installation'
      | 'installation_request'
      | 'installation_wallet'
      | 'permission'
      | 'shared'
      | 'wallet'
      | 'generic'
      | 'historical';
  };
  progress?: {
    total_steps?: number;
    done_steps?: number;
    percentage?: number;
    [k: string]: number;
  };
  times: number;
  timestamp: string;
  identifier: string;
  url?: string;
  meta: Meta21;

  [k: string]: JsonObjType;
}
export interface Meta21 {
  id: string;
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
