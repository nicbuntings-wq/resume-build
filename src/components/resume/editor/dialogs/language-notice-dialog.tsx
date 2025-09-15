'use client';

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LanguageNoticeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PROMPT_TEXT = `Please change any American English to British English for the whole resume

If you have generated a cover letter, check that too, as you will need to paste the entire text into the bot and ask it to recognise any changes needed

Important tip: If you paste the location of the job in the cover letter prompt, it will automatically tailor the English type to that location`;

export function LanguageNoticeDialog({ open, onOpenChange }: LanguageNoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Language Notice</DialogTitle>
          <DialogDescription>
            This resume is currently in <strong>American English</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            If you want <strong>British English</strong>, paste this prompt into the chatbot below:
          </p>
          <pre className="bg-muted rounded-md p-3 whitespace-pre-wrap text-xs leading-relaxed">
            {PROMPT_TEXT}
          </pre>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>OK, got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
