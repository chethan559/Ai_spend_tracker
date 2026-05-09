'use client';

import FeatureBreakdownTable from '@/components/FeatureBreakdownTable';
import type { MetadataStat } from '@/types';

interface UserCostTableProps {
  data: MetadataStat[] | undefined;
  isLoading: boolean;
  dateRange: { from: Date; to: Date };
}

export default function UserCostTable({ data, isLoading, dateRange }: UserCostTableProps) {
  return (
    <FeatureBreakdownTable
      field="userId"
      data={data}
      isLoading={isLoading}
      dateRange={dateRange}
    />
  );
}
