// Shared profile types to avoid 'any' usage
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  username: string | null;
  user_code: string;
  wallet_balance: number | null;
  total_earnings: number | null;
  referral_earnings: number | null;
  total_computing_power: number | null;
  avatar_url: string | null;
  referral_level: string | null;
  phone: string | null;
  inviter_code: string | null;
  email_verified: boolean | null;
  tcoin_balance: number | null;
  saved_wallet_address: string | null;
  transaction_pin_hash: string | null;
  created_at: string | null;
  updated_at: string | null;
  verification_code: string | null;
  verification_expires_at: string | null;
}

export interface ProfileWithPosition extends Profile {
  position_title?: string | null;
}
