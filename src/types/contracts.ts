// Project status enum matching contract
export enum ProjectStatus {
  Created = 0,
  Funded = 1,
  Completed = 2,
  Disputed = 3,
  PendingAcceptance = 4,  // Waiting for talent acceptance
  Declined = 5,           // Talent declined with refund
  PendingClientApproval = 6  // Talent submitted work, waiting for client approval
}

// Project data structure from contract
export interface ProjectData {
  client: string;
  talent: string;
  scout: string;
  amount: bigint;
  scoutFeePercent: number;
  platformFeePercent: number;
  status: ProjectStatus;
}

// Transaction state
export enum TransactionState {
  Idle = 'idle',
  Signing = 'signing',
  Broadcasting = 'broadcasting',
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed'
}

export interface TransactionStatus {
  state: TransactionState;
  txId?: string;
  error?: string;
  blockHeight?: number;
}

// Contract function result types
export interface CreateProjectResult {
  projectId: number;
  txId: string;
}

export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  txId?: string;
  error?: string;
}
