export type Permission = {
  create?: string[];
  permit_to_send_email?: boolean;
  permit_to_send_sms?: boolean;
  [k: string]: unknown;
};
