import { useDisabled } from "@enymo/react-form-component";
import classNames from "classnames";
import _ from "lodash";
import React, { HTMLInputTypeAttribute, useCallback, useRef } from "react";
import { RegisterOptions, useFormContext } from "react-hook-form";
import { StyleRule, Stylesheet } from "../Stylesheet";
import { GlideInputConfig, InputLabelPosition, InputStyle } from "../types";

let glideCounter = 0;

const globalStyle = new Stylesheet();

globalStyle.addRule(".glide-input .input", {
    color: "inherit"
});

globalStyle.apply();

export type InputProps<PrefixProps, SuffixProps> = {
    form?: string,
    /**
     * The name of the input. This is used to register the input with the form context.
     */
    name?: string,
    /**
     * The label of the input.
     */
    label?: string,
    /**
     * The class name of the input. It is appended to the default class name.
     */
    className?: string,
    /**
     * The style of the input. It is merged with the default style.
     */
    style?: React.CSSProperties,
    /**
     * The error the input should show. If not provided, the error is taken from the form context.
     */
    error?: string,
    /**
     * The placeholder of the input.
     */
    placeholder?: string,
    /**
     * The value of the input. Used for controlled inputs.
     */
    value?: string,
    /**
     * The function that is called when the value of the input changes. Used for controlled inputs.
     */
    onChange?: (value: string) => void,
    /**
     * Whether the input is disabled. If not provided, the disabled state is taken from the form context.
     */
    disabled?: boolean,
    /**
     * The flex value of the input.
     */
    flex?: number,
    /**
     * The type of the input. Defaults to "text".
     */
    type?: HTMLInputTypeAttribute | "textarea" | "select",
    /**
     * The options for the react-hook-form register function.
     */
    options?: RegisterOptions,
    /**
     * The minimum value of a number input. On other input types, this prop is ignored
     */
    min?: number,
    /**
     * The maximum value of a number input. On other input types, this prop is ignored
     */
    max?: number
    /**
     * The step of a number input. On other input types, this prop is ignored
     */
    step?: number
    /**
     * The number of rows of a textarea. On other input types, this prop is ignored
     */
    rows?: number
    /**
     * Only used for select-type inputs to specify options. On other input types, this prop is ignored
     */
    children?: React.ReactNode
} & PrefixProps & SuffixProps;

function addInputRules(rule: StyleRule, styles: InputStyle & {
    labelPosition?: InputLabelPosition,
    selectIndicator?: React.FC
}, responsiveRules: boolean = false) {
    const inputRowRule = rule.addRule(".input-row", !responsiveRules ? {
        display: "flex",
        alignItems: "center",
    } : {});
    const inputWrapRule = inputRowRule.addRule(".input-wrap", responsiveRules ? styles.style : {
        display: "flex",
        flex: 1,
        alignItems: "stretch",
        cursor: "text",
        ...styles.style
    });
    const inputLabelWrapRule = inputWrapRule.addRule(".inside-label-wrap", responsiveRules ? undefined : {
        position: "relative",
        display: "flex",
        flex: 1,
        flexDirection: "column",
    });
    inputLabelWrapRule.addRule(".select-indicator", {
        position: "absolute",
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        ...styles.selectIndicatorStyle
    });
    const inputRule = inputLabelWrapRule.addRule(".input", responsiveRules ? {
        padding: styles.inputPadding,
    } : {
        border: "none",
        outline: "none",
        backgroundColor: "transparent",
        flex: 1,
        padding: styles.inputPadding ?? "0",
        fontSize: "inherit",
        width: "100%",
        ...(styles.selectIndicator ? {
            appearance: "none"
        } : {})
    });
    inputRule.addRule("&::placeholder", styles.labelPosition === "placeholder" ? styles.labelStyle : styles.placeholderStyle);
    

    inputWrapRule.addRule("&:hover", styles.hoverStyle);
    inputWrapRule.addRule("&:focus-within:not(.error)", styles.focusStyle);
    inputWrapRule.addRule("&.error", styles.errorStyle);
    inputWrapRule.addRule("&.disabled", styles.disabledStyle);

    const inputLabelRule = rule.addRule(".input-label", styles.labelStyle);
    inputLabelRule.addRule("&.outside-top-label", {
        display: !responsiveRules && styles.labelPosition == "outside-top" ? "flex" : "none",
        marginBottom: styles.labelGap,
    });
    inputLabelRule.addRule("&.outside-left-label", {
        display: !responsiveRules && styles.labelPosition == "outside-left" ? "flex" : "none",
        marginRight: styles.labelGap,
    });
    inputLabelRule.addRule("&.inside-top-label", {
        display: !responsiveRules && styles.labelPosition == "inside-top" ? "flex" : "none",
        marginBottom: styles.labelGap,
    });
    
    rule.addRule(".input-error", responsiveRules ? styles.errorTextStyle : {
        marginTop: styles.errorGap,
        ...styles.errorTextStyle
    });
}

export default <PrefixProps extends object, SuffixProps extends object>(config: GlideInputConfig<PrefixProps, SuffixProps>) => {
    const glideClassName = `glide-input-${++glideCounter}`;
    const style = new Stylesheet();
    const rule = style.addRule(`.${glideClassName}`, {
        display: "flex",
        flexDirection: "column",
    });
    addInputRules(rule, config);

    if (config.responsive) {
        for (const { mode, width, ...styles } of config.responsive) {
            const responsiveRule = style.addMediaRule([{ mode, width }]);
            const rule = responsiveRule.addRule(`.${glideClassName}`);
            addInputRules(rule, {
                labelPosition: config.labelPosition,
                ...styles
            }, true);
        }
    }

    style.apply(config.debug);

    return ({
        name,
        label,
        className,
        style,
        flex,
        placeholder,
        value,
        onChange,
        disabled: disabledProp,
        error: errorProp,
        type = "text",
        options,
        children,
        min,
        max,
        rows,
        form: formId,
        ...props
    }: InputProps<PrefixProps, SuffixProps>) => {

        const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>();
        const handleWrapperClick = useCallback(() => inputRef.current?.focus(), [inputRef]);

        const form = useFormContext();
        const disabledContext = useDisabled();
        const disabled = disabledProp ?? disabledContext ?? false;
        const hasError = errorProp !== undefined || (name ? _.get(form?.formState.errors, name!) !== undefined : false);
        const error = errorProp ?? name ? _.get(form?.formState.errors, name!)?.message as string : undefined;

        const { ref: registerRef, ...register } = name && form ? form.register(name, disabled ? undefined : options) : { ref: undefined };

        return (
            <div className={classNames("glide-input", glideClassName, config.className, className, {textarea: type === "textarea"})} style={{ flex, ...style }}>
                {label && (
                    <span className={classNames("input-label", "outside-top-label")}>{label}</span>
                )}
                <div className="input-row">
                    {label && (
                        <span className={classNames("input-label", "outside-left-label")}>{label}</span>
                    )}
                    <div className={classNames("input-wrap", { error: hasError, disabled })} onClick={handleWrapperClick}>
                        {config.prefix && React.createElement(config.prefix, props as PrefixProps)}
                        <div className="inside-label-wrap">
                            {label && (
                                <span className={classNames("input-label", "inside-top-label")}>{label}</span>
                            )}
                            {type === "select" ? <>
                                <select
                                    ref={e => {
                                        registerRef?.(e);
                                        if (e) {
                                            inputRef.current = e;
                                        }
                                    }}
                                    className={classNames("input", { error })}
                                    name={name}
                                    value={value}
                                    onChange={e => onChange?.(e.target.value)}
                                    disabled={disabled}
                                    form={formId}
                                    {...register}
                                >
                                    {children}
                                </select>
                                {config.selectIndicator && React.createElement(config.selectIndicator, {
                                    className: "select-indicator"
                                })}
                            </> : React.createElement(type == "textarea" ? "textarea" : "input", {
                                ref: (e: HTMLInputElement | HTMLTextAreaElement) => {
                                    registerRef?.(e);
                                    inputRef.current = e;
                                },
                                className: classNames("input", { error: hasError }),
                                type,
                                name,
                                placeholder: config.labelPosition == "placeholder" ? label : placeholder,
                                value,
                                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(e.target.value),
                                disabled,
                                min,
                                max,
                                rows,
                                form: formId,
                                ...register,
                            })}
                        </div>
                        {config.suffix && React.createElement(config.suffix, props as SuffixProps)}
                    </div>
                </div>
                {error && (config.errorComponent ? (
                    React.createElement(config.errorComponent, { error: error })
                ) : (
                    <span className="input-error">{error}</span>
                ))}
            </div>
        )
    }

}