import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const countryCodes = [
  { code: "IT", name: "Italia", dial: "+39", flag: "🇮🇹" },
  { code: "US", name: "USA", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "UK", dial: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Germania", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "Francia", dial: "+33", flag: "🇫🇷" },
  { code: "ES", name: "Spagna", dial: "+34", flag: "🇪🇸" },
  { code: "PT", name: "Portogallo", dial: "+351", flag: "🇵🇹" },
  { code: "NL", name: "Paesi Bassi", dial: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgio", dial: "+32", flag: "🇧🇪" },
  { code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹" },
  { code: "CH", name: "Svizzera", dial: "+41", flag: "🇨🇭" },
  { code: "PL", name: "Polonia", dial: "+48", flag: "🇵🇱" },
  { code: "GR", name: "Grecia", dial: "+30", flag: "🇬🇷" },
  { code: "SE", name: "Svezia", dial: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norvegia", dial: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Danimarca", dial: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finlandia", dial: "+358", flag: "🇫🇮" },
  { code: "IE", name: "Irlanda", dial: "+353", flag: "🇮🇪" },
  { code: "RO", name: "Romania", dial: "+40", flag: "🇷🇴" },
  { code: "HU", name: "Ungheria", dial: "+36", flag: "🇭🇺" },
  { code: "CZ", name: "Rep. Ceca", dial: "+420", flag: "🇨🇿" },
  { code: "HR", name: "Croazia", dial: "+385", flag: "🇭🇷" },
  { code: "SI", name: "Slovenia", dial: "+386", flag: "🇸🇮" },
  { code: "SK", name: "Slovacchia", dial: "+421", flag: "🇸🇰" },
  { code: "BG", name: "Bulgaria", dial: "+359", flag: "🇧🇬" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "UA", name: "Ucraina", dial: "+380", flag: "🇺🇦" },
  { code: "TR", name: "Turchia", dial: "+90", flag: "🇹🇷" },
  { code: "BR", name: "Brasile", dial: "+55", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { code: "MX", name: "Messico", dial: "+52", flag: "🇲🇽" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "Nuova Zelanda", dial: "+64", flag: "🇳🇿" },
  { code: "JP", name: "Giappone", dial: "+81", flag: "🇯🇵" },
  { code: "KR", name: "Corea Sud", dial: "+82", flag: "🇰🇷" },
  { code: "CN", name: "Cina", dial: "+86", flag: "🇨🇳" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "AE", name: "Emirati Arabi", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Arabia Saudita", dial: "+966", flag: "🇸🇦" },
  { code: "EG", name: "Egitto", dial: "+20", flag: "🇪🇬" },
  { code: "ZA", name: "Sudafrica", dial: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "MA", name: "Marocco", dial: "+212", flag: "🇲🇦" },
  { code: "TN", name: "Tunisia", dial: "+216", flag: "🇹🇳" },
  { code: "AL", name: "Albania", dial: "+355", flag: "🇦🇱" },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export const PhoneInput = ({
  value,
  onChange,
  placeholder,
  className,
  maxLength = 20,
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState("IT");
  
  const currentCountry = countryCodes.find((c) => c.code === selectedCountry);
  const dialCode = currentCountry?.dial || "+39";
  
  // Extract the phone number without the dial code
  const phoneWithoutCode = value.startsWith(dialCode) 
    ? value.slice(dialCode.length).trim() 
    : value;

  const handlePhoneChange = (phoneNumber: string) => {
    // Only allow digits
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    onChange(`${dialCode}${cleanNumber}`);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const newDialCode = countryCodes.find((c) => c.code === countryCode)?.dial || "+39";
    // Update the full number with new dial code
    const cleanNumber = phoneWithoutCode.replace(/\D/g, "");
    onChange(`${newDialCode}${cleanNumber}`);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={selectedCountry} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[100px] bg-background/50 shrink-0">
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span>{currentCountry?.flag}</span>
              <span className="text-xs text-muted-foreground">{dialCode}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[280px] bg-background z-50">
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span className="text-sm">{country.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{country.dial}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        placeholder={placeholder}
        value={phoneWithoutCode}
        onChange={(e) => handlePhoneChange(e.target.value)}
        className="bg-background/50 flex-1"
        maxLength={maxLength}
      />
    </div>
  );
};
