import { useEffect, useRef } from "react";
import { Editor } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { history } from "@milkdown/kit/plugin/history";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { Milkdown, MilkdownProvider, useEditor, useInstance } from "@milkdown/react";
import { rootCtx, defaultValueCtx, editorViewOptionsCtx } from "@milkdown/kit/core";
import { replaceAll } from "@milkdown/utils";

type MarkdownEditorProps = {
    value: string;
    onChange?: (value: string) => void;
    readonly?: boolean;
    placeholder?: string;
};

function EditorInner({ value, onChange, readonly }: MarkdownEditorProps) {
    const valueRef = useRef(value);
    const onChangeRef = useRef(onChange);
    const isInternalChange = useRef(false);

    onChangeRef.current = onChange;

    useEditor((root) => {
        const editor = Editor.make();

        editor
            .config((ctx) => {
                ctx.set(rootCtx, root);
                ctx.set(defaultValueCtx, value);
                if (readonly) {
                    ctx.update(editorViewOptionsCtx, (prev) => ({
                        ...prev,
                        editable: () => false,
                    }));
                }
            })
            .use(commonmark);

        if (!readonly) {
            editor
                .use(history)
                .use(listener)
                .config((ctx) => {
                    ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
                        if (markdown !== prevMarkdown) {
                            isInternalChange.current = true;
                            valueRef.current = markdown;
                            onChangeRef.current?.(markdown);
                        }
                    });
                });
        }

        return editor;
    }, [readonly]);

    const [loading, getEditor] = useInstance();
    const getEditorRef = useRef(getEditor);
    getEditorRef.current = getEditor;

    useEffect(() => {
        if (loading || readonly) return;
        const editor = getEditorRef.current();
        if (!editor) return;
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        if (value !== valueRef.current) {
            valueRef.current = value;
            editor.action(replaceAll(value));
        }
    }, [value, loading, readonly]);

    return <Milkdown />;
}

export function MarkdownEditor(props: MarkdownEditorProps) {
    return (
        <MilkdownProvider>
            <EditorInner {...props} />
        </MilkdownProvider>
    );
}
