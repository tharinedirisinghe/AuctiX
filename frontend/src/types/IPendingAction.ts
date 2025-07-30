export interface IPendingAction {
  id: string;
  actionType: string | null;
  context: object | null;
  resolvedAt: Date | string | null;
  createdAt: Date | string | null;
  resolved: boolean;
}
