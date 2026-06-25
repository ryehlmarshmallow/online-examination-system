import { Fragment } from "react";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/shared/components/ui/combobox";
import type { ValidatedQuestion } from "../../lib/schema";
import type { SystemLimitsResponse } from "@/shared/types/system";

interface AllowedExtensionsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  options: string[];
}

const AllowedExtensionsInput = ({ value, onChange, disabled, options }: AllowedExtensionsInputProps) => {
  const anchor = useComboboxAnchor();

  return (
    <Combobox
      multiple
      autoHighlight
      items={options}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values) => (
            <Fragment>
              {values.map((val: string) => (
                <ComboboxChip key={val}>{val}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder="Select extensions..." />
            </Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No extensions found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

interface FileQuestionFormProps {
  question: ValidatedQuestion;
  qIndex: number;
  index: number;
  restricted: boolean;
  systemLimits?: SystemLimitsResponse;
  updateQuestion: (qIndex: number, updated: Partial<ValidatedQuestion>) => void;
}

export function FileQuestionForm({
                                   question,
                                   qIndex,
                                   index,
                                   restricted,
                                   systemLimits,
                                   updateQuestion
                                 }: FileQuestionFormProps) {
  if (question.type !== "FILE") return null;

  const content = question.content;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Max File Size (MB)</Label>
        <Input
          id={`file-size-${index}-${qIndex}`}
          aria-label="Max file size"
          type="number"
          disabled={restricted}
          value={content.maxFileSizeMegabytes}
          onChange={(e) => updateQuestion(qIndex, {
            type: "FILE",
            content: { ...content, maxFileSizeMegabytes: Number(e.target.value) }
          })}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Allowed Extensions</Label>
        <AllowedExtensionsInput
          options={systemLimits?.allowedExtensions || []}
          disabled={restricted}
          value={content.allowedExtensions}
          onChange={(val) => updateQuestion(qIndex, {
            type: "FILE",
            content: {
              ...content,
              allowedExtensions: val
            }
          })}
        />
      </div>
    </div>
  );
}
