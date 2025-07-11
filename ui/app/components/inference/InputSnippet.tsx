import type {
  DisplayInputMessageContent,
  DisplayInputMessage,
} from "~/utils/clickhouse/common";
import {
  SnippetLayout,
  SnippetContent,
  SnippetHeading,
  SnippetDivider,
  SnippetMessage,
} from "~/components/layout/SnippetLayout";
import {
  ToolCallMessage,
  ToolResultMessage,
  ImageMessage,
  FileErrorMessage,
  FileMessage,
  AudioMessage,
  TextMessage,
  EmptyMessage,
} from "~/components/layout/SnippetContent";
import type { JsonObject } from "type-fest";
import { CodeBlock } from "../ui/code-block";

interface InputSnippetProps {
  messages: DisplayInputMessage[];
  system?: string | JsonObject | null;
}

function renderContentBlock(block: DisplayInputMessageContent, index: number) {
  switch (block.type) {
    case "structured_text": {
      return (
        <TextMessage
          key={index}
          label="Text (Arguments)"
          content={
            <CodeBlock
              padded={false}
              raw={JSON.stringify(block.arguments, null, 2)}
            />
          }
        />
      );
    }

    case "unstructured_text": {
      return <TextMessage key={index} label="Text" content={block.text} />;
    }

    case "missing_function_text": {
      return (
        <TextMessage
          key={index}
          label="Text (Missing Function Config)"
          content={block.value}
        />
      );
    }

    case "raw_text":
      return (
        <TextMessage
          key={index}
          label="Text (Raw)"
          content={<CodeBlock padded={false} raw={block.value} />}
        />
      );

    case "tool_call": {
      let serializedArguments;
      // Arguments is a string that should parse to JSON. If the parsing fails we can just render it as a string.
      try {
        serializedArguments = JSON.stringify(
          JSON.parse(block.arguments),
          null,
          2,
        );
      } catch {
        serializedArguments = block.arguments;
      }
      return (
        <ToolCallMessage
          key={index}
          toolName={block.name}
          toolArguments={serializedArguments}
          // TODO: if arguments is null, display raw arguments without parsing
          toolCallId={block.id}
        />
      );
    }

    case "tool_result":
      return (
        <ToolResultMessage
          key={index}
          toolName={block.name}
          toolResult={block.result}
          toolResultId={block.id}
        />
      );

    case "file":
      if (block.file.mime_type.startsWith("image/")) {
        return (
          <ImageMessage
            key={index}
            url={block.file.dataUrl}
            downloadName={`tensorzero_${block.storage_path.path}`}
          />
        );
      } else if (block.file.mime_type.startsWith("audio/")) {
        return (
          <AudioMessage
            key={index}
            fileData={block.file.dataUrl}
            mimeType={block.file.mime_type}
            filePath={block.storage_path.path}
          />
        );
      } else {
        return (
          <FileMessage
            key={index}
            fileData={block.file.dataUrl}
            mimeType={block.file.mime_type}
            filePath={block.storage_path.path}
          />
        );
      }

    case "file_error":
      return <FileErrorMessage key={index} error="Failed to retrieve file" />;

    default:
      return null;
  }
}

function renderMessage(message: DisplayInputMessage) {
  return (
    <SnippetMessage variant="input" role={message.role}>
      {message.content.map(
        (block: DisplayInputMessageContent, blockIndex: number) =>
          renderContentBlock(block, blockIndex),
      )}
    </SnippetMessage>
  );
}

export default function InputSnippet({ system, messages }: InputSnippetProps) {
  return (
    <SnippetLayout>
      {system && (
        <>
          <SnippetHeading heading="System" />
          <SnippetContent>
            <SnippetMessage>
              {typeof system === "object" ? (
                (() => {
                  let serializedSystem;
                  try {
                    serializedSystem = JSON.stringify(system, null, 2);
                  } catch (e) {
                    return (
                      <div style={{ color: "red" }}>
                        Error serializing system field: {String(e)}
                      </div>
                    );
                  }
                  return (
                    <TextMessage
                      content={
                        <CodeBlock padded={false} raw={serializedSystem} />
                      }
                    />
                  );
                })()
              ) : (
                <TextMessage content={system} />
              )}
            </SnippetMessage>
          </SnippetContent>
          <SnippetDivider />
        </>
      )}

      <div>
        {messages.length === 0 ? (
          <SnippetContent>
            <EmptyMessage message="No input messages found" />
          </SnippetContent>
        ) : (
          <>
            <SnippetHeading heading="Messages" />
            <SnippetContent>
              {messages.map((message, messageIndex) => (
                <div key={messageIndex}>{renderMessage(message)}</div>
              ))}
            </SnippetContent>
          </>
        )}
      </div>
    </SnippetLayout>
  );
}
