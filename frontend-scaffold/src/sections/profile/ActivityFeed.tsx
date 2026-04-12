import { Zap } from "lucide-react";
import React from "react";

import ZapCard from "@/components/zap/ZapCard";
import Button from "@/components/primitives/Button";
import EmptyState from "@/components/primitives/EmptyState";
import { useZaps } from "@/hooks/useZaps";
import Loader from "@/components/primitives/Loader";

interface ActivityFeedProps {
  /** Creator address to filter zaps for */
  address: string;
  /** Maximum number of zaps to load per batch (default: 5) */
  limit?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ address, limit = 5 }) => {
  const { tips, loading, error, loadMore, hasMore } = useZaps(
    address,
    "creator",
    limit,
  );

  if (loading && tips.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Fetching activity..." />
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <EmptyState
        icon={<Zap size={32} />}
        title="No zaps received yet"
        description={
          error ||
          "Share your public profile link and your first supporter will appear here."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {tips.map((tip) => (
          <ZapCard
            key={tip.id}
            zap={tip}
            showSender={true}
            showReceiver={false}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="editorial"
            size="sm"
            onClick={loadMore}
            loading={loading}
            className="!w-auto px-8"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
