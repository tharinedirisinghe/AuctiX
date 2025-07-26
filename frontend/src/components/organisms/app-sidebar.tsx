import React, { useEffect } from 'react';
import { Command } from 'lucide-react';
import { CollapsibleNavItem } from '../molecules/collapsible-navitem';

import { NavUser } from '@/components/molecules/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { IUser } from '@/types/IUser';
import { useAppSelector } from '@/hooks/hooks';
import { Link, useLocation } from 'react-router-dom';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const userData = useAppSelector((state) => state.user as IUser);
  const userRole: string | null = userData?.role ?? null;
  const location = useLocation();

  const fullNav = [
    {
      title: 'Dashboard',
      items: [
        { title: 'Overview', url: '/dashboard', isActive: true },
        {
          title: 'Auctions',
          url: '/manage-auctions',
          roles: ['SELLER'],
        },
        {
          title: 'My Bids',
          url: '/my-bids',
          roles: ['BIDDER'],
        },
        {
          title: 'Watch List',
          url: '/watchlist',
          roles: ['BIDDER'],
        },

        {
          title: 'Management',
          items: [
            {
              title: 'Delivery',
              url: '/delivery',
              roles: ['SELLER'],
            },
            {
              title: 'Complaints',
              url: '/complaints',
              roles: ['ADMIN', 'SUPER_ADMIN'],
            },
            { title: 'Users', url: '/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
            {
              title: 'Admin Management',
              url: '/admin-management',
              roles: ['SUPER_ADMIN'],
            },
          ],
        },
        {
          title: 'Settings',
          items: [
            { title: 'Profile Settings', url: '/settings/profile' },
            { title: 'Security Settings', url: '/settings/security' },
            {
              title: 'Get Verified',
              url: '/seller-verification-submit',
              roles: ['SELLER'],
            },
          ],
        },
      ],
    },
  ];

  function setActiveFlags(items: any[], currentPath: string): any[] {
    return items.map((item) => {
      let isActive = false;

      if (item.url && item.url === currentPath) {
        isActive = true;
      }

      let newItem = { ...item, isActive };

      if (item.items) {
        newItem.items = setActiveFlags(item.items, currentPath);

        // If any child is active, mark parent active too
        if (newItem.items.some((child: any) => child.isActive)) {
          newItem.isActive = true;
        }
      }

      return newItem;
    });
  }

  function filterNavByRole(items: any[], userRole: string | null): any[] {
    return items
      .map((item) => {
        // Check if userRole allowed on this item (if roles defined)
        if (item.roles && (!userRole || !item.roles.includes(userRole))) {
          return null;
        }

        // Recursively filter child items if exist
        if (item.items) {
          const filteredChildren = filterNavByRole(item.items, userRole);
          // If no children remain, exclude this item
          if (filteredChildren.length === 0) return null;

          return { ...item, items: filteredChildren };
        }

        return item;
      })
      .filter(Boolean); // Remove nulls
  }

  const [data, setData] = React.useState({
    user: {
      name: '',
      email: '',
      avatar: '/defaultProfilePhoto.jpg',
    },

    navMain: fullNav,
  });

  useEffect(() => {
    const filteredNav = filterNavByRole(fullNav, userRole);
    const navWithActive = setActiveFlags(filteredNav, location.pathname);
    setData((prevData) => ({
      ...prevData,
      user: {
        name: userData.username
          ? `${userData.firstName} ${userData?.lastName}`
          : '',
        email: userData.email || '',
        avatar: userData.profile_photo || '/defaultProfilePhoto.jpg',
      },
      navMain: navWithActive,
    }));
  }, [
    userData.profile_photo,
    userData.firstName,
    userData.lastName,
    userRole,
    location.pathname,
  ]);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="pl-4">
        <Link to="/">
          <span className="text-black text-4xl font-normal font-productsans leading-normal">
            Aucti
          </span>
          <span className="text-[#ecb02d] text-4xl font-normal font-productsans leading-normal">
            X
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <CollapsibleNavItem key={item.title} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          key={`${data.user.avatar}-${data.user.name}-${data.user.email}`}
          user={data.user}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
