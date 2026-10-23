export const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Medicine',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
] as const;

export const CONDITIONS = ['stable', 'critical', 'recovering', 'observation', 'discharged'] as const;
export const GENDERS = ['male', 'female', 'other'] as const;
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type Specialization = (typeof SPECIALIZATIONS)[number];
export type Condition = (typeof CONDITIONS)[number];
export type Gender = (typeof GENDERS)[number];
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: Specialization;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorDetail extends Doctor {
  byCondition: Partial<Record<Condition, number>>;
}

export interface DoctorRef {
  _id: string;
  name: string;
  specialization: Specialization;
  hospital?: string;
}

export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  bloodGroup?: BloodGroup;
  condition: Condition;
  diagnosis?: string;
  admissionDate: string;
  doctor: DoctorRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorOptions {
  doctors: Array<{ id: string; name: string; specialization: Specialization }>;
  hospitals: string[];
  specializations: Specialization[];
}

export type StatsRange = '7d' | '30d' | '90d' | '12m';

export interface Overview {
  range: StatsRange;
  unit: 'day' | 'week' | 'month';
  generatedAt: string;
  totals: {
    doctors: number;
    patients: number;
    criticalPatients: number;
    admissionsInRange: number;
    admissionsTrend: number | null;
    newDoctorsInRange: number;
    avgPatientsPerDoctor: number;
  };
  timeline: Array<{ date: string; admissions: number; critical: number }>;
  conditions: Array<{ condition: Condition; count: number }>;
  topDoctors: Array<{ id: string; name: string; specialization: Specialization; patients: number }>;
  specializations: Array<{ specialization: Specialization; doctors: number; patients: number }>;
  genders: Array<{ gender: Gender; count: number }>;
  ageGroups: Array<{ group: string; count: number }>;
  recentPatients: Array<Pick<Patient, '_id' | 'name' | 'condition' | 'admissionDate' | 'createdAt' | 'age' | 'gender' | 'doctor'>>;
}

export interface DoctorListParams {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: string;
  to?: string;
  sort?: string;
}

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  condition?: string;
  gender?: string;
  doctor?: string;
  ageMin?: string;
  ageMax?: string;
  from?: string;
  to?: string;
  sort?: string;
}

export interface PatientInput {
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  bloodGroup?: BloodGroup | '';
  condition: Condition;
  diagnosis?: string;
  admissionDate: string;
  doctor?: string;
}

export interface DoctorInput {
  name: string;
  specialization: Specialization;
  hospital: string;
  phone: string;
  email: string;
}
