const StatCard = ({ label, value, change }) => {
    return (
        <div className="bg-elevated p-4 rounded-lg flex flex-col gap-1 shadow-sm">
            <div className="text-[0.8125rem] text-tertiary uppercase tracking-wider font-medium">{label}</div>
            <div className="text-2xl font-bold text-primary">{value}</div>
            <span className="text-[0.8125rem] text-success font-semibold">{change}</span>
        </div>
    );
};

export default StatCard;
