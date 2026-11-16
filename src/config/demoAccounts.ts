export interface DemoAccount {
  label: string;
  role: 'secretary' | 'resident' | 'committee';
  name: string;
  gmail: string;
  password: string;
  details: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Secretary',
    role: 'secretary',
    name: 'Ramesh Patel',
    gmail: 'secretary56@gmail.com',
    password: 'Password123!',
    details: 'Society Secretary (Greenwood Heights)',
  },
  {
    label: 'Resident (Block A)',
    role: 'resident',
    name: 'Ayush',
    gmail: 'ayushcharchi7@gmail.com',
    password: '12345678',
    details: 'Flat 201, Block A',
  },
  {
    label: 'Resident (Block B)',
    role: 'resident',
    name: 'Aakash Sharma',
    gmail: 'aakash.sharma@example.com',
    password: 'Password123!',
    details: 'Flat 202, Block B',
  },
  {
    label: 'Committee',
    role: 'committee',
    name: 'Vikram Joshi',
    gmail: 'vikram.committee@grievdesk.org',
    password: 'Password123!',
    details: 'Committee Member',
  },
];
