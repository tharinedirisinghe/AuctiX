import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import type { UseFormReturn } from 'react-hook-form';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';

// Define the interface directly without using z
interface AddressSectionProps {
  form: UseFormReturn<any>;
}

// List of countries for the combobox
const countries = [
  { label: 'Afghanistan', value: 'afghanistan' },
  { label: 'Albania', value: 'albania' },
  { label: 'Algeria', value: 'algeria' },
  { label: 'Andorra', value: 'andorra' },
  { label: 'Angola', value: 'angola' },
  { label: 'Antigua and Barbuda', value: 'antigua-and-barbuda' },
  { label: 'Argentina', value: 'argentina' },
  { label: 'Armenia', value: 'armenia' },
  { label: 'Australia', value: 'australia' },
  { label: 'Austria', value: 'austria' },
  { label: 'Azerbaijan', value: 'azerbaijan' },
  { label: 'Bahamas', value: 'bahamas' },
  { label: 'Bahrain', value: 'bahrain' },
  { label: 'Bangladesh', value: 'bangladesh' },
  { label: 'Barbados', value: 'barbados' },
  { label: 'Belarus', value: 'belarus' },
  { label: 'Belgium', value: 'belgium' },
  { label: 'Belize', value: 'belize' },
  { label: 'Benin', value: 'benin' },
  { label: 'Bhutan', value: 'bhutan' },
  { label: 'Bolivia', value: 'bolivia' },
  { label: 'Bosnia and Herzegovina', value: 'bosnia-and-herzegovina' },
  { label: 'Botswana', value: 'botswana' },
  { label: 'Brazil', value: 'brazil' },
  { label: 'Brunei', value: 'brunei' },
  { label: 'Bulgaria', value: 'bulgaria' },
  { label: 'Burkina Faso', value: 'burkina-faso' },
  { label: 'Burundi', value: 'burundi' },
  { label: 'Cabo Verde', value: 'cabo-verde' },
  { label: 'Cambodia', value: 'cambodia' },
  { label: 'Cameroon', value: 'cameroon' },
  { label: 'Canada', value: 'canada' },
  { label: 'Central African Republic', value: 'central-african-republic' },
  { label: 'Chad', value: 'chad' },
  { label: 'Chile', value: 'chile' },
  { label: 'China', value: 'china' },
  { label: 'Colombia', value: 'colombia' },
  { label: 'Comoros', value: 'comoros' },
  { label: 'Congo', value: 'congo' },
  { label: 'Costa Rica', value: 'costa-rica' },
  { label: 'Croatia', value: 'croatia' },
  { label: 'Cuba', value: 'cuba' },
  { label: 'Cyprus', value: 'cyprus' },
  { label: 'Czech Republic', value: 'czech-republic' },
  { label: 'Denmark', value: 'denmark' },
  { label: 'Djibouti', value: 'djibouti' },
  { label: 'Dominica', value: 'dominica' },
  { label: 'Dominican Republic', value: 'dominican-republic' },
  { label: 'East Timor', value: 'east-timor' },
  { label: 'Ecuador', value: 'ecuador' },
  { label: 'Egypt', value: 'egypt' },
  { label: 'El Salvador', value: 'el-salvador' },
  { label: 'Equatorial Guinea', value: 'equatorial-guinea' },
  { label: 'Eritrea', value: 'eritrea' },
  { label: 'Estonia', value: 'estonia' },
  { label: 'Eswatini', value: 'eswatini' },
  { label: 'Ethiopia', value: 'ethiopia' },
  { label: 'Fiji', value: 'fiji' },
  { label: 'Finland', value: 'finland' },
  { label: 'France', value: 'france' },
  { label: 'Gabon', value: 'gabon' },
  { label: 'Gambia', value: 'gambia' },
  { label: 'Georgia', value: 'georgia' },
  { label: 'Germany', value: 'germany' },
  { label: 'Ghana', value: 'ghana' },
  { label: 'Greece', value: 'greece' },
  { label: 'Grenada', value: 'grenada' },
  { label: 'Guatemala', value: 'guatemala' },
  { label: 'Guinea', value: 'guinea' },
  { label: 'Guinea-Bissau', value: 'guinea-bissau' },
  { label: 'Guyana', value: 'guyana' },
  { label: 'Haiti', value: 'haiti' },
  { label: 'Honduras', value: 'honduras' },
  { label: 'Hungary', value: 'hungary' },
  { label: 'Iceland', value: 'iceland' },
  { label: 'India', value: 'india' },
  { label: 'Indonesia', value: 'indonesia' },
  { label: 'Iran', value: 'iran' },
  { label: 'Iraq', value: 'iraq' },
  { label: 'Ireland', value: 'ireland' },
  { label: 'Israel', value: 'israel' },
  { label: 'Italy', value: 'italy' },
  { label: 'Jamaica', value: 'jamaica' },
  { label: 'Japan', value: 'japan' },
  { label: 'Jordan', value: 'jordan' },
  { label: 'Kazakhstan', value: 'kazakhstan' },
  { label: 'Kenya', value: 'kenya' },
  { label: 'Kiribati', value: 'kiribati' },
  { label: 'Korea, North', value: 'korea-north' },
  { label: 'Korea, South', value: 'korea-south' },
  { label: 'Kosovo', value: 'kosovo' },
  { label: 'Kuwait', value: 'kuwait' },
  { label: 'Kyrgyzstan', value: 'kyrgyzstan' },
  { label: 'Laos', value: 'laos' },
  { label: 'Latvia', value: 'latvia' },
  { label: 'Lebanon', value: 'lebanon' },
  { label: 'Lesotho', value: 'lesotho' },
  { label: 'Liberia', value: 'liberia' },
  { label: 'Libya', value: 'libya' },
  { label: 'Liechtenstein', value: 'liechtenstein' },
  { label: 'Lithuania', value: 'lithuania' },
  { label: 'Luxembourg', value: 'luxembourg' },
  { label: 'Madagascar', value: 'madagascar' },
  { label: 'Malawi', value: 'malawi' },
  { label: 'Malaysia', value: 'malaysia' },
  { label: 'Maldives', value: 'maldives' },
  { label: 'Mali', value: 'mali' },
  { label: 'Malta', value: 'malta' },
  { label: 'Marshall Islands', value: 'marshall-islands' },
  { label: 'Mauritania', value: 'mauritania' },
  { label: 'Mauritius', value: 'mauritius' },
  { label: 'Mexico', value: 'mexico' },
  { label: 'Micronesia', value: 'micronesia' },
  { label: 'Moldova', value: 'moldova' },
  { label: 'Monaco', value: 'monaco' },
  { label: 'Mongolia', value: 'mongolia' },
  { label: 'Montenegro', value: 'montenegro' },
  { label: 'Morocco', value: 'morocco' },
  { label: 'Mozambique', value: 'mozambique' },
  { label: 'Myanmar', value: 'myanmar' },
  { label: 'Namibia', value: 'namibia' },
  { label: 'Nauru', value: 'nauru' },
  { label: 'Nepal', value: 'nepal' },
  { label: 'Netherlands', value: 'netherlands' },
  { label: 'New Zealand', value: 'new-zealand' },
  { label: 'Nicaragua', value: 'nicaragua' },
  { label: 'Niger', value: 'niger' },
  { label: 'Nigeria', value: 'nigeria' },
  { label: 'North Macedonia', value: 'north-macedonia' },
  { label: 'Norway', value: 'norway' },
  { label: 'Oman', value: 'oman' },
  { label: 'Pakistan', value: 'pakistan' },
  { label: 'Palau', value: 'palau' },
  { label: 'Panama', value: 'panama' },
  { label: 'Papua New Guinea', value: 'papua-new-guinea' },
  { label: 'Paraguay', value: 'paraguay' },
  { label: 'Peru', value: 'peru' },
  { label: 'Philippines', value: 'philippines' },
  { label: 'Poland', value: 'poland' },
  { label: 'Portugal', value: 'portugal' },
  { label: 'Qatar', value: 'qatar' },
  { label: 'Romania', value: 'romania' },
  { label: 'Russia', value: 'russia' },
  { label: 'Rwanda', value: 'rwanda' },
  { label: 'Saint Kitts and Nevis', value: 'saint-kitts-and-nevis' },
  { label: 'Saint Lucia', value: 'saint-lucia' },
  {
    label: 'Saint Vincent and the Grenadines',
    value: 'saint-vincent-and-the-grenadines',
  },
  { label: 'Samoa', value: 'samoa' },
  { label: 'San Marino', value: 'san-marino' },
  { label: 'Sao Tome and Principe', value: 'sao-tome-and-principe' },
  { label: 'Saudi Arabia', value: 'saudi-arabia' },
  { label: 'Senegal', value: 'senegal' },
  { label: 'Serbia', value: 'serbia' },
  { label: 'Seychelles', value: 'seychelles' },
  { label: 'Sierra Leone', value: 'sierra-leone' },
  { label: 'Singapore', value: 'singapore' },
  { label: 'Slovakia', value: 'slovakia' },
  { label: 'Slovenia', value: 'slovenia' },
  { label: 'Solomon Islands', value: 'solomon-islands' },
  { label: 'Somalia', value: 'somalia' },
  { label: 'South Africa', value: 'south-africa' },
  { label: 'South Sudan', value: 'south-sudan' },
  { label: 'Spain', value: 'spain' },
  { label: 'Sri Lanka', value: 'sri-lanka' },
  { label: 'Sudan', value: 'sudan' },
  { label: 'Suriname', value: 'suriname' },
  { label: 'Sweden', value: 'sweden' },
  { label: 'Switzerland', value: 'switzerland' },
  { label: 'Syria', value: 'syria' },
  { label: 'Taiwan', value: 'taiwan' },
  { label: 'Tajikistan', value: 'tajikistan' },
  { label: 'Tanzania', value: 'tanzania' },
  { label: 'Thailand', value: 'thailand' },
  { label: 'Togo', value: 'togo' },
  { label: 'Tonga', value: 'tonga' },
  { label: 'Trinidad and Tobago', value: 'trinidad-and-tobago' },
  { label: 'Tunisia', value: 'tunisia' },
  { label: 'Turkey', value: 'turkey' },
  { label: 'Turkmenistan', value: 'turkmenistan' },
  { label: 'Tuvalu', value: 'tuvalu' },
  { label: 'Uganda', value: 'uganda' },
  { label: 'Ukraine', value: 'ukraine' },
  { label: 'United Arab Emirates', value: 'united-arab-emirates' },
  { label: 'United Kingdom', value: 'united-kingdom' },
  { label: 'United States', value: 'united-states' },
  { label: 'Uruguay', value: 'uruguay' },
  { label: 'Uzbekistan', value: 'uzbekistan' },
  { label: 'Vanuatu', value: 'vanuatu' },
  { label: 'Vatican City', value: 'vatican-city' },
  { label: 'Venezuela', value: 'venezuela' },
  { label: 'Vietnam', value: 'vietnam' },
  { label: 'Yemen', value: 'yemen' },
  { label: 'Zambia', value: 'zambia' },
  { label: 'Zimbabwe', value: 'zimbabwe' },
];

export function AddressSection({ form }: AddressSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="space-y-4"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 100,
          },
        },
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="address.addressNumber"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>House/Building Number</FormLabel>
              <FormControl>
                <Input placeholder="123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.country"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Country</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        'w-full justify-between',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value
                        ? countries.find(
                            (country) => country.value === field.value,
                          )?.label
                        : 'Select country'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {countries.map((country) => (
                          <CommandItem
                            key={country.value}
                            value={country.value}
                            onSelect={(value) => {
                              form.setValue('address.country', value);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                field.value === country.value
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {country.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.addressLine1"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input placeholder="Street address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.addressLine2"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Address Line 2 (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apartment, suite, unit, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </motion.div>
  );
}
