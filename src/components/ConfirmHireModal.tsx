import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ConfirmHireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  candidateName: string;
  position: string;
  isLoading: boolean;
}

export function ConfirmHireModal({
  isOpen,
  onClose,
  onConfirm,
  candidateName,
  position,
  isLoading,
}: ConfirmHireModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Hiring Decision</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to confirm the selection of <strong>{candidateName}</strong> for the{" "}
              <strong>{position}</strong> position.
            </p>
            <p className="text-amber-600 dark:text-amber-400">
              This action will:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Mark the candidate as <strong>Hired</strong></li>
              <li>Send an offer email notification to the candidate</li>
              <li>Create an in-app notification for the candidate</li>
              <li>Log your decision for audit purposes</li>
            </ul>
            <p className="font-medium mt-2">
              This action cannot be undone. Do you want to proceed?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Select Candidate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
