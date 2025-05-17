// components/PolicyEditor.tsx
"use client";

import { ContentState, convertToRaw, EditorState } from "draft-js";
import dynamic from "next/dynamic";
import * as React from "react";
import { useEffect, useState } from "react";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import draftToHtml from "draftjs-to-html";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import htmlToDraft from "html-to-draftjs";

// Dynamically import to avoid SSR issues
const Editor = dynamic(
  () => import("react-draft-wysiwyg").then((mod) => mod.Editor),
  {
    ssr: false,
  },
);

export default function HtmlEditor({
  initialHtml,
  onSave,
  isLoading,
}: {
  initialHtml?: string;
  onSave: (html: string) => void;
  isLoading?: boolean;
}) {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const handleSave = () => {
    const rawContent = convertToRaw(editorState.getCurrentContent());
    const html = draftToHtml(rawContent);
    onSave(html);
  };

  useEffect(() => {
    if (initialHtml) {
      const blocksFromHtml = htmlToDraft(initialHtml);
      if (blocksFromHtml) {
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(
          contentBlocks,
          entityMap,
        );
        setEditorState(EditorState.createWithContent(contentState));
      }
    }
  }, [initialHtml]);

  return (
    <div className="space-y-4">
      <div className="border min-h-[300px] p-2 rounded bg-white">
        <Editor
          editorState={editorState}
          onEditorStateChange={setEditorState}
          toolbar={{
            options: ["inline", "blockType", "list", "link", "history"],
            fontSize: {
              options: [12, 14, 16, 18, 24, 30],
            },
          }}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          Save
          {isLoading && <LoaderCircle size={16} className="animate-spin" />}
        </Button>
      </div>
    </div>
  );
}
