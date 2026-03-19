import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

const PageHeader = ({ title, description, action }: PageHeaderProps) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 className="text-lg font-semibold text-gray-100 sm:text-xl md:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-300">{description}</p>}
    </div>
    {action && <div className="w-full sm:mt-1 sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
  </div>
);

export default PageHeader;
