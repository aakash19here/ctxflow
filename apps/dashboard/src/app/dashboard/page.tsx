"use client";

import { UserChats } from "@/components/dashboard/user-chats";
import { WhatsAppChats } from "@/components/dashboard/whatsapp-chats";
import { SectionCards } from "@/components/section-cards";
import { trpc } from "@/utils/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { GlobeIcon } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

interface CountryData {
  country: string;
  country_code?: string;
  visitors: number;
  pageviews: number;
}

interface CountryRowProps {
  country: CountryData;
  totalVisitors: number;
}

function CountryRow({ country, totalVisitors }: CountryRowProps) {
  const percentage =
    totalVisitors > 0 ? (country.visitors / totalVisitors) * 100 : 0;
  const getColor = (pct: number) =>
    pct >= 50
      ? ["rgba(34, 197, 94, 0.08)", "rgba(34, 197, 94, 0.8)"]
      : pct >= 25
      ? ["rgba(59, 130, 246, 0.08)", "rgba(59, 130, 246, 0.8)"]
      : pct >= 10
      ? ["rgba(245, 158, 11, 0.08)", "rgba(245, 158, 11, 0.8)"]
      : ["rgba(107, 114, 128, 0.06)", "rgba(107, 114, 128, 0.7)"];
  const [bgColor, accentColor] = getColor(percentage);

  return (
    <button
      className="flex w-full cursor-pointer items-center gap-2.5 px-1.5 py-3 text-left transition-all hover:opacity-80"
      style={{
        background: percentage > 0 ? bgColor : undefined,
        boxShadow:
          percentage > 0 ? `inset 2px 0 0 0 ${accentColor}` : undefined,
      }}
      type="button"
    >
      <div className="relative h-4 w-5 flex-shrink-0 overflow-hidden border border-border/20 shadow-sm">
        <Image
          alt={`${country.country} flag`}
          className="object-cover"
          fill
          sizes="32p"
          src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${
            country.country_code?.toUpperCase() || country.country.toUpperCase()
          }.svg`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="truncate font-medium text-xs">{country.country}</div>
          <span className="ml-1 font-semibold text-primary text-xs">
            {country.visitors > 999
              ? `${(country.visitors / 1000).toFixed(0)}k`
              : country.visitors.toString()}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function Page() {
  const { data, isLoading } = useQuery(
    trpc.analytics.getCountries.queryOptions()
  );

  const locationData = useMemo(() => {
    const countries = (data || []).map(
      (item: {
        name: string;
        visitors: number;
        pageviews: number;
        country_code?: string;
        country_name?: string;
      }) => ({
        country: item.country_name || item.name,
        country_code: item.country_code || item.name,
        visitors: item.visitors,
        pageviews: item.pageviews,
      })
    );
    return { countries };
  }, [data?.length]);

  const topCountries = useMemo(
    () =>
      locationData.countries
        .filter((c) => c.country && c.country.trim() !== "")
        .slice(0, 5),
    [locationData.countries]
  );

  const totalVisitors = useMemo(
    () =>
      locationData.countries.reduce(
        (sum, country) => sum + country.visitors,
        0
      ),
    [locationData.countries]
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <UserChats />
      <WhatsAppChats />
      <Card className="mx-5 py-5">
        <CardHeader className="px-3">
          <CardTitle className="flex items-center gap-2 font-semibold">
            <GlobeIcon className="size-5 text-primary" />
            <span>Top Countries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-1 px-3 pb-2">
              {new Array(5).fill(0).map((_, i) => (
                <div
                  className="flex items-center gap-2.5 py-1.5"
                  key={`country-skeleton-${i + 1}`}
                >
                  <Skeleton className="h-5 w-4" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-8" />
                </div>
              ))}
            </div>
          ) : topCountries.length > 0 ? (
            <div className="space-y-0.5">
              {topCountries.map((country) => (
                <CountryRow
                  country={country}
                  key={country.country}
                  totalVisitors={totalVisitors}
                />
              ))}

              {/* Total visitors summary */}
              <div className="border-border/50 border-t px-2 pt-1.5 pb-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold text-primary">
                    {totalVisitors > 999
                      ? `${(totalVisitors / 1000).toFixed(0)}k`
                      : totalVisitors.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
              <div className="mb-1.5 flex h-6 w-6 items-center justify-center bg-muted/20">
                <GlobeIcon className="h-3 w-3 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground text-xs">
                No data
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
