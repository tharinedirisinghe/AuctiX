import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavLink } from 'react-router-dom';

interface NavItem {
  title: string;
  url?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export function CollapsibleNavItem({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!item.items && item.url) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={item.isActive}>
          <NavLink to={item.url}>{item.title}</NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="w-full justify-between">
            {item.title}
            <ChevronDown
              className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1">
          <SidebarMenu className="ml-4 w-auto">
            {item.items &&
              item.items.map((subItem) => (
                <CollapsibleNavItem key={subItem.title} item={subItem} />
              ))}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
