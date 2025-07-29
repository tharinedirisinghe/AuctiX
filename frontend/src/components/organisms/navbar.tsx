import { Bell, Search, Menu, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { IUser } from '@/types/IUser';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { logout } from '@/store/slices/authSlice';
import { Notification } from '@/types/notification';
import {
  fetchLatestNotifications,
  fetchUnreadCount,
  markNotificationReadThunk,
} from '@/store/slices/notificationSlice';
import AuctionSearchBar from '../molecules/AuctionSearchBar';

export function Navbar() {
  const userData = useAppSelector((state) => state.user as IUser);
  const authState = useAppSelector((state) => state.auth);
  const notificationState = useAppSelector((state) => state.notifications);

  const dispatch = useAppDispatch();
  const handleLogout = () => {
    dispatch(logout());
  };

  const NotificationWrapper = ({
    notification,
    children,
  }: {
    notification: Notification;
    children: React.ReactNode;
  }) => {
    const commonClasses = `relative group p-4 border shadow-sm transition-all duration-200 ${
      notification.read
        ? 'bg-muted/50 border-transparent'
        : 'bg-yellow-50 border-yellow-300'
    } hover:shadow-md hover:bg-yellow-100 ${notification.partialUrl ? 'cursor-pointer' : 'cursor-default'}`;

    const handleClick = () => {
      if (!notification.read) {
        dispatch(markNotificationReadThunk(notification.id));
      }
      if (notification.partialUrl) {
        window.open(notification.partialUrl, '_blank', 'noopener,noreferrer');
      }
    };

    if (notification.partialUrl) {
      return (
        <a
          href={notification.partialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block ${commonClasses}`}
          onClick={(e) => {
            e.preventDefault();
            handleClick();
          }}
        >
          {children}
        </a>
      );
    }

    return (
      <div
        className={commonClasses}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 w-full border-b bg-background z-50">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-normal font-productsans">
            Aucti<span className="text-[#eaac26]">X</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/explore-auctions">
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    Explore
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/feedback">
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    Feedback
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/about">
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    About us
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Search bar */}
        <div className="hidden lg:block w-full max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            {/* <Input
              type="search"
              placeholder="Search auctions"
              className="w-full pl-10"
            /> */}
            <AuctionSearchBar />
          </div>
        </div>

        {/* Auth buttons or user controls */}
        <div className="flex items-center gap-4">
          {authState.isUserLoggedIn ? (
            <>
              <NavigationMenu
                onValueChange={(value) => {
                  if (value) {
                    dispatch(fetchUnreadCount());
                    dispatch(fetchLatestNotifications());
                  }
                }}
              >
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="hidden md:inline-flex relative p-0">
                      <Bell className="h-5 w-5" />
                      {notificationState.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
                          {notificationState.unreadCount}
                        </span>
                      )}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="w-80 p-0">
                      <div className="max-h-96 min-w-[320px] overflow-y-auto divide-y">
                        {notificationState.latestItems &&
                        notificationState.latestItems.length > 0 ? (
                          notificationState.latestItems.map(
                            (notification: Notification, idx: number) => (
                              <NotificationWrapper
                                key={notification.id || idx}
                                notification={notification}
                              >
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  {notification.title || 'Notification'}
                                  {notification.partialUrl && (
                                    <ExternalLink
                                      className="w-3 h-3 text-muted-foreground"
                                      aria-label="Link available"
                                    />
                                  )}{' '}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {notification.content}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1">
                                  {new Date(
                                    notification.createdAt,
                                  ).toLocaleString(undefined, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </div>
                              </NotificationWrapper>
                            ),
                          )
                        ) : (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            No notifications
                          </div>
                        )}
                      </div>
                      <div className="border-t p-2 flex justify-center">
                        <Link to="/notifications" className="w-full">
                          <Button variant="ghost" className="w-full">
                            View all notifications
                          </Button>
                        </Link>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <Link to="/dashboard" className="flex items-center gap-2">
                <Avatar className="hidden md:inline-flex h-8 w-8">
                  <AvatarImage
                    src={userData.profile_photo ?? '/default-avatar.png'}
                    alt="User"
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {userData?.username ?? ''}
                </span>
              </Link>

              <Button variant="secondary" onClick={() => handleLogout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="hidden md:inline-flex">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="hidden md:inline-flex">Sign up</Button>
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex items-center mb-4">
                  <span className="text-4xl font-normal font-productsans">
                    Aucti<span className="text-orange-500">X</span>
                  </span>
                </div>
                {/* <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Type a command or search..."
                    className="pl-10"
                  />
                </div> */}
                <AuctionSearchBar />
                <nav className="flex flex-col gap-4">
                  <Link to="/">
                    <Button variant="ghost" className="justify-start w-full">
                      Home
                    </Button>
                  </Link>
                  <Link to="/explore">
                    <Button variant="ghost" className="justify-start w-full">
                      Explore
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="ghost" className="justify-start w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/about">
                    <Button variant="ghost" className="justify-start w-full">
                      About us
                    </Button>
                  </Link>
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  {authState.isUserLoggedIn ? (
                    <>
                      <div className="flex items-center gap-2 p-2">
                        <Link to="/dashboard">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                userData.profile_photo ?? '/default-avatar.png'
                              }
                              alt="User"
                            />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <span>
                            {(userData?.firstName ?? '') +
                              ' ' +
                              (userData?.lastName ?? '')}
                          </span>
                        </Link>
                      </div>
                      <Button variant="ghost" className="flex gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                      </Button>

                      <Button variant="outline" onClick={() => handleLogout()}>
                        Log out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                          Log in
                        </Button>
                      </Link>
                      <Link to="/register" className="w-full">
                        <Button className="w-full">Sign up</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
