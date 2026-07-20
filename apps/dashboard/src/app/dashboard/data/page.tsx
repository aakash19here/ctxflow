"use client";

import DocumentInput from "@/components/dashboard/data/document-input";
import { DataTableDemo } from "@/components/dashboard/data/table";
import WebsiteInput from "@/components/dashboard/data/website-input";

export default function Page() {
  return (
    <div className="flex h-full flex-col gap-5 p-6 md:p-10">
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <WebsiteInput />
        <DocumentInput />
        {/* <Button
          variant="outline"
          className="w-full justify-between bg-card group disabled"
          size={"lg"}
          onClick={() => toast.info("Coming soon...")}
        >
          Youtube Video
          <MonitorPlay className="group-hover:scale-110 group-hover:text-primary transform ease-in-out duration-500" />
        </Button> */}
      </div>
      <DataTableDemo />
    </div>
  );
}
