"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/components/Container";
import { NavbarSearch } from "@/components/NavbarSearch";

type NavbarUser = {
  name: string;
  email: string;
} | null;

type PremiumNavbarProps = {
  user: NavbarUser;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/videos", label: "Videos" },
  { href: "/search", label: "Search" },
];

const categoryItems = [
  { href: "/search?q=trending", label: "Trending" },
  { href: "/search?category=AI", label: "AI" },
  { href: "/search?category=Gaming", label: "Gaming" },
  { href: "/search?category=Technology", label: "Technology" },
  { href: "/search?category=Startups", label: "Startups" },
  { href: "/search?category=Cybersecurity", label: "Cybersecurity" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="relative h-4 w-5" aria-hidden="true">
      <span
        className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition ${
          isOpen ? "translate-y-[7px] rotate-45" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-current transition ${
          isOpen ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}

function LiveIndicator() {
  return (
    <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3.5 py-2 text-xs font-semibold text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.08)] xl:flex">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
      </span>
      Live content updating
    </div>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:flex"
    >
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ${
              isActive
                ? "text-white"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {isActive ? (
              <span className="absolute inset-0 rounded-xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_24px_rgba(34,211,238,0.18)]" />
            ) : null}
            <span className="relative">{item.label}</span>
            {isActive ? (
              <span className="absolute inset-x-3 bottom-0 h-px rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function CategoryQuickAccess() {
  return (
    <Container className="pb-3.5">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <nav aria-label="Category quick access" className="flex min-w-max gap-2.5">
          {categoryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </Container>
  );
}

function UserMenu({ user }: { user: Exclude<NavbarUser, null> }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = (user.name || user.email).slice(0, 1).toUpperCase();

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      localStorage.removeItem("token");
      document.cookie = "token=; path=/; max-age=0; samesite=lax";
      setIsOpen(false);
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition hover:border-cyan-300/40 hover:bg-white/[0.09]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-300 text-xs font-black text-ink-950 shadow-[0_0_20px_rgba(34,211,238,0.22)]">
          {initial}
        </span>
        <span className="hidden max-w-28 truncate lg:block">{user.name}</span>
      </button>

      <div
        className={`absolute right-0 top-12 z-50 w-64 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-ink-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_36px_rgba(34,211,238,0.12)] backdrop-blur-xl transition duration-200 ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="border-b border-white/10 px-4 py-3">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>
        </div>

        <div className="p-2">
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/dashboard#saved", label: "Saved items" },
            { href: "/dashboard/settings", label: "Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
            className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100 disabled:cursor-wait disabled:opacity-70"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthActions({ user }: { user: NavbarUser }) {
  if (user) {
    return <UserMenu user={user} />;
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link
        href="/login"
        className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-ink-950 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 hover:bg-white"
      >
        Register
      </Link>
    </div>
  );
}

function MobileDrawer({
  isOpen,
  pathname,
  user,
  onClose,
}: {
  isOpen: boolean;
  pathname: string;
  user: NavbarUser;
  onClose: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => null);
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0; samesite=lax";
    onClose();
    router.replace("/");
    router.refresh();
  }

  return (
    <div
      className={`fixed inset-x-0 top-[124px] z-40 max-h-[calc(100vh-124px)] overflow-y-auto border-b border-white/10 bg-ink-950/96 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition duration-300 md:hidden ${
        isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-6 opacity-0"
      }`}
    >
      <Container className="space-y-6 py-6">
        <NavbarSearch className="block max-w-none" initiallyExpanded />

        <nav aria-label="Mobile navigation" className="grid gap-2.5">
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`rounded-2xl border px-4 py-4 text-base font-semibold transition ${
                  isActive
                    ? "border-cyan-300/40 bg-cyan-300/10 text-white"
                    : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="grid gap-2.5 border-t border-white/10 pt-5">
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="rounded-2xl bg-white/[0.06] px-4 py-4 text-base font-semibold text-white transition hover:bg-white/[0.1]"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={onClose}
                className="rounded-2xl bg-white/[0.06] px-4 py-4 text-base font-semibold text-white transition hover:bg-white/[0.1]"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-2xl bg-red-500/10 px-4 py-4 text-left text-base font-semibold text-red-200 transition hover:bg-red-500/15"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="rounded-2xl bg-white/[0.06] px-4 py-4 text-base font-semibold text-white transition hover:bg-white/[0.1]"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="rounded-2xl bg-cyan-300 px-4 py-4 text-base font-bold text-ink-950 transition hover:bg-white"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

export function PremiumNavbar({ user }: PremiumNavbarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mobileDrawerId = "mobile-navigation";
  const memoizedUser = useMemo(() => user, [user]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-300/10 bg-ink-950/76 shadow-[0_18px_70px_rgba(0,0,0,0.34),0_0_34px_rgba(34,211,238,0.09)] backdrop-blur-2xl">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <Container className="relative flex min-h-16 items-center justify-between gap-3 py-3.5 sm:gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-300 text-sm font-black text-ink-950 shadow-[0_0_34px_rgba(34,211,238,0.24)] transition group-hover:scale-105">
            M
          </span>
          <span className="hidden font-heading text-base font-semibold tracking-tight text-white sm:block">
            MultiContent
          </span>
        </Link>

        <DesktopNav pathname={pathname} />

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <LiveIndicator />
          <NavbarSearch />
        </div>

        <AuthActions user={memoizedUser} />

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-controls={mobileDrawerId}
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-200 transition hover:border-cyan-300/40 hover:text-white md:hidden"
        >
          <MenuIcon isOpen={isMobileOpen} />
        </button>
      </Container>

      <CategoryQuickAccess />

      <div id={mobileDrawerId}>
        <MobileDrawer
          isOpen={isMobileOpen}
          pathname={pathname}
          user={memoizedUser}
          onClose={() => setIsMobileOpen(false)}
        />
      </div>
    </header>
  );
}
