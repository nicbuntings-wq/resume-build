"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function LanguageNoticeDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Language Notice</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            This resume is currently in <strong>American English</strong>.
          </p>
          <p>
            If you want <strong>British English</strong>, paste this prompt into the chatbot below:
          </p>

          {/* Grey box only for the main prompt */}
          <div className="p-3 rounded-md bg-muted text-xs font-mono">
            Please change any American English to British English for the whole resume
          </div>

          {/* Additional notes outside the grey box */}
          <p>
            If you have generated a cover letter, check that too — paste the entire text into
            the bot and ask it to recognise any changes needed.
          </p>
          <p>
            <strong>Tip:</strong> If you paste the location of the job in the cover letter
            prompt, it will automatically tailor the English type to that location.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
