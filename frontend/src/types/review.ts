export type ReviewInputType = 'prUrl' | 'diffText';

export interface ReviewFormValues {
  inputType: ReviewInputType;
  prUrl?: string;
  diffText?: string;
}