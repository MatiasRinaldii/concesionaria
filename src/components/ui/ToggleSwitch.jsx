/**
 * Reusable toggle switch component
 * Extracted from Settings.jsx for consistency across the app
 * 
 * Usage:
 * - Controlled: <ToggleSwitch checked={value} onChange={setValue} />
 * - Uncontrolled: <ToggleSwitch defaultChecked={true} />
 */
const ToggleSwitch = ({
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    id,
    name
}) => {
    // Use controlled mode if onChange is provided, otherwise uncontrolled
    const isControlled = onChange !== undefined;

    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                id={id}
                name={name}
                {...(isControlled
                    ? { checked, onChange }
                    : { defaultChecked: defaultChecked ?? checked }
                )}
                disabled={disabled}
                className="sr-only peer"
            />
            <div className={`
                w-11 h-6 bg-elevated rounded-full peer 
                peer-checked:after:translate-x-full 
                rtl:peer-checked:after:-translate-x-full 
                peer-checked:after:border-white 
                after:content-[''] 
                after:absolute 
                after:top-[2px] 
                after:start-[2px] 
                after:bg-white 
                after:border-gray-300 
                after:border 
                after:rounded-full 
                after:h-5 
                after:w-5 
                after:transition-all 
                peer-checked:bg-primary
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `} />
        </label>
    );
};

export default ToggleSwitch;
