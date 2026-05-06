import { IconFile, IconUsers } from "@tabler/icons-react";

import { trpc } from "@/utils/trpc";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function SectionCards() {
  const { data: userCount, isPending: isUserCountPending } = useQuery(
    trpc.analytics.getUserCount.queryOptions()
  );

  const { data: documentCount, isPending: isDocumentCountPending } = useQuery(
    trpc.analytics.getDocumentCount.queryOptions()
  );

  const queryClient = useQueryClient();
  const queryKey = trpc.analytics.getWhatsAppChats.queryKey();
  const queryState = queryClient.getQueryState(queryKey);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total User Count</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isUserCountPending ? <Skeleton className="h-4 w-4" /> : userCount}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Visitors on the embed</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Documents</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isDocumentCountPending ? (
              <Skeleton className="h-4 w-4" />
            ) : (
              documentCount
            )}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total Documents Ingested <IconFile className="size-4" />
          </div>
          <div className="text-muted-foreground">
            PDF, DOCX , DOC , WEBSITES ..
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Whatsapp Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {queryState && queryState.status === "pending" ? (
              <Skeleton className="h-4 w-4" />
            ) : queryState?.data?.totalUsers ? (
              queryState.data.totalUsers
            ) : (
              0
            )}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total Whatsapp Users <IconUsers className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Users who have interacted with the chatbot
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
