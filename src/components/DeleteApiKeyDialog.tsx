import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

interface DeleteApiKeyDialogProps {
  onDelete: () => void;
}

export const DeleteApiKeyDialog = ({ onDelete }: DeleteApiKeyDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button variant="destructive" size="icon" title="Delete API Key">
            <Trash2 className="h-4 w-4" />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this API key? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onDelete}>
            Yes, delete key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
