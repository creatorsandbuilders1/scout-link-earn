// Mock data for REFERYDO! platform

export interface User {
  id: string;
  username: string;
  full_name: string;
  avatar: string;
  headline: string;
  reputation: number;
  scout_connections_count: number;
  projects_completed_count: number;
  talent_availability: boolean;
  gated_connections: boolean;
  roles: ('talent' | 'scout' | 'client')[];
}

export interface Service {
  id: string;
  talent_id: string;
  title: string;
  description: string;
  price: number;
  finder_fee: number;
  images: string[];
  skills: string[];
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  duration: string;
  level: string;
  skills: string[];
  applications_count: number;
  recommendations_count: number;
  posted_at: string;
}

export interface Contract {
  id: string;
  project_title: string;
  client_id: string;
  talent_id: string;
  scout_id?: string;
  status: 'active' | 'pending_funding' | 'in_dispute' | 'completed';
  total_value: number;
  escrow_amount: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  value: number;
  status: 'pending' | 'submitted' | 'approved';
}

// Current logged-in user
export const currentUser: User = {
  id: 'user-1',
  username: 'jesuel',
  full_name: 'Jesuel Rodriguez',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jesuel',
  headline: 'Motion Designer & Web3 Creative',
  reputation: 98,
  scout_connections_count: 24,
  projects_completed_count: 47,
  talent_availability: true,
  gated_connections: false,
  roles: ['talent', 'scout', 'client'],
};

// Mock talents for Discovery Hub
export const mockTalents: User[] = [
  {
    id: 'talent-1',
    username: 'sarah_designs',
    full_name: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    headline: 'Brand Identity Designer • Tokyo, JP',
    reputation: 99,
    scout_connections_count: 18,
    projects_completed_count: 65,
    talent_availability: true,
    gated_connections: false,
    roles: ['talent'],
  },
  {
    id: 'talent-2',
    username: 'alex_dev',
    full_name: 'Alex Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    headline: 'Smart Contract Developer • Berlin, DE',
    reputation: 97,
    scout_connections_count: 32,
    projects_completed_count: 89,
    talent_availability: true,
    gated_connections: false,
    roles: ['talent', 'scout'],
  },
  {
    id: 'talent-3',
    username: 'maya_creates',
    full_name: 'Maya Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya',
    headline: '3D Animator & Motion Graphics • NYC, US',
    reputation: 96,
    scout_connections_count: 15,
    projects_completed_count: 42,
    talent_availability: false,
    gated_connections: false,
    roles: ['talent'],
  },
  {
    id: 'talent-4',
    username: 'carlos_code',
    full_name: 'Carlos Silva',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    headline: 'Full-Stack Web3 Engineer • São Paulo, BR',
    reputation: 98,
    scout_connections_count: 28,
    projects_completed_count: 73,
    talent_availability: true,
    gated_connections: false,
    roles: ['talent'],
  },
  {
    id: 'talent-5',
    username: 'nina_visual',
    full_name: 'Nina Patel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nina',
    headline: 'Visual Designer & Illustrator • Mumbai, IN',
    reputation: 95,
    scout_connections_count: 21,
    projects_completed_count: 38,
    talent_availability: true,
    gated_connections: false,
    roles: ['talent'],
  },
  {
    id: 'talent-6',
    username: 'david_crypto',
    full_name: 'David Wong',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    headline: 'Blockchain Architect • Singapore, SG',
    reputation: 99,
    scout_connections_count: 45,
    projects_completed_count: 112,
    talent_availability: true,
    gated_connections: true,
    roles: ['talent', 'scout'],
  },
];

// Mock services
export const mockServices: Service[] = [
  {
    id: 'service-1',
    talent_id: 'talent-1',
    title: 'Complete Brand Identity Package',
    description: 'Logo, brand guidelines, social media kit',
    price: 2500,
    finder_fee: 12,
    images: [
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
      'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=400',
      'https://images.unsplash.com/photo-1634942537909-e2ea8c87e5f3?w=400',
    ],
    skills: ['Branding', 'Logo Design', 'Adobe Illustrator'],
  },
  {
    id: 'service-2',
    talent_id: 'talent-2',
    title: 'Smart Contract Development',
    description: 'Custom Clarity smart contracts for Stacks',
    price: 5000,
    finder_fee: 15,
    images: [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
      'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400',
    ],
    skills: ['Clarity', 'Blockchain', 'Web3'],
  },
];

// Mock jobs
export const mockJobs: Job[] = [
  {
    id: 'job-1',
    client_id: 'client-1',
    title: 'NFT Collection Design & Smart Contract',
    description: 'Looking for a designer and developer duo to create a 10k NFT collection with minting smart contract on Stacks blockchain.',
    budget_min: 8000,
    budget_max: 12000,
    duration: '2-3 Months',
    level: 'Expert',
    skills: ['NFT Design', 'Smart Contracts', 'Generative Art', 'Clarity'],
    applications_count: 8,
    recommendations_count: 12,
    posted_at: '2025-10-18',
  },
  {
    id: 'job-2',
    client_id: 'client-2',
    title: 'DeFi Dashboard UI/UX Design',
    description: 'Need a talented UI/UX designer to create a modern, clean dashboard for our DeFi protocol. Must understand Web3 user flows.',
    budget_min: 3000,
    budget_max: 5000,
    duration: '1 Month',
    level: 'Intermediate',
    skills: ['UI/UX Design', 'Figma', 'Web3', 'DeFi'],
    applications_count: 5,
    recommendations_count: 8,
    posted_at: '2025-10-19',
  },
  {
    id: 'job-3',
    client_id: 'client-3',
    title: 'Motion Graphics for Token Launch',
    description: 'Creating exciting launch campaign for our new token. Need 3 video explainers and social media motion graphics.',
    budget_min: 2000,
    budget_max: 3500,
    duration: '3 Weeks',
    level: 'Intermediate',
    skills: ['Motion Graphics', 'After Effects', 'Video Editing'],
    applications_count: 12,
    recommendations_count: 5,
    posted_at: '2025-10-20',
  },
];

// Mock contracts
export const mockContracts: Contract[] = [
  {
    id: 'contract-1',
    project_title: 'Brand Redesign for DeFi Platform',
    client_id: 'client-1',
    talent_id: 'user-1',
    scout_id: 'scout-1',
    status: 'active',
    total_value: 4500,
    escrow_amount: 3000,
    milestones: [
      { id: 'm1', title: 'Initial Concepts', value: 1500, status: 'approved' },
      { id: 'm2', title: 'Final Design System', value: 1500, status: 'submitted' },
      { id: 'm3', title: 'Implementation Support', value: 1500, status: 'pending' },
    ],
  },
  {
    id: 'contract-2',
    project_title: 'NFT Marketplace Smart Contracts',
    client_id: 'client-2',
    talent_id: 'user-1',
    status: 'pending_funding',
    total_value: 6000,
    escrow_amount: 0,
    milestones: [
      { id: 'm4', title: 'Core Contract', value: 3000, status: 'pending' },
      { id: 'm5', title: 'Testing & Audit', value: 1500, status: 'pending' },
      { id: 'm6', title: 'Deployment', value: 1500, status: 'pending' },
    ],
  },
];

export const getUserById = (id: string): User | undefined => {
  if (id === currentUser.id) return currentUser;
  return mockTalents.find(t => t.id === id);
};
