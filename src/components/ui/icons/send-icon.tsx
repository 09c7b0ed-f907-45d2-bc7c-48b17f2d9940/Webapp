//https://fonts.google.com/icons?icon.query=send&selected=Material+Symbols+Outlined:send:FILL@0;wght@400;GRAD@0;opsz@24&icon.size=24&icon.color=%231f1f1f
const SendIcon = ({

    className,
}: {

    className?: string;
}) => {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M4.4 19.425q-.5.2-.95-.088T3 18.5V14l8-2l-8-2V5.5q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925z" />
        </svg>
    );
};

export { SendIcon };