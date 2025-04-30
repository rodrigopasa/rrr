interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  change?: {
    value: string;
    isPositive: boolean;
    text: string;
  };
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  change,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <div className={`p-2 rounded-full ${iconBgColor} ${iconColor}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {change && (
        <p className="text-sm text-gray-500 mt-2">
          <span
            className={`${
              change.isPositive ? "text-[#10b981]" : "text-[#ef4444]"
            } font-medium`}
          >
            <i
              className={`${
                change.isPositive ? "ri-arrow-up-line" : "ri-arrow-down-line"
              }`}
            ></i>{" "}
            {change.value}
          </span>{" "}
          {change.text}
        </p>
      )}
    </div>
  );
}
