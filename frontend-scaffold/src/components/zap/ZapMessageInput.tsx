import React from "react";
import Textarea from "@/components/primitives/Textarea";

interface ZapMessageInputProps {
  message: string;
  onChange: (message: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

const ZapMessageInput: React.FC<ZapMessageInputProps> = ({
  message,
  onChange,
  maxLength = 160,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <Textarea
      label="Message"
      variant="editorial"
      placeholder="Optional note to the creator"
      value={message}
      onChange={handleChange}
      maxLength={maxLength}
      disabled={disabled}
      rows={3}
      className="resize-none"
    />
  );
};

export default ZapMessageInput;
