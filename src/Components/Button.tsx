import { Clickable, ClickableProps } from "@enymo/react-clickable-router";
import { useDisabled, useLoading } from "@enymo/react-form-component";
import classNames from "classnames";
import React, { useCallback, useState } from "react";
import { Stylesheet } from "../Stylesheet";
import { ButtonVariantStyle, GlideButtonConfig, NonOptional, WithoutPrivate } from "../types";

const globalStyle = new Stylesheet();

const buttonRule = globalStyle.addRule(".glide-button", {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
});
buttonRule.addRule(".loading-wrap", {
    display: "none",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
});

const loadingButtonRule = globalStyle.addRule("&.loading");
loadingButtonRule.addRule(".content", {
    visibility: "hidden"
});
loadingButtonRule.addRule(".loading-wrap", {
    display: "flex"
});

globalStyle.apply();

let glideCounter = 0;

export interface ButtonProps<Variants extends string> extends Omit<ClickableProps, "children" | "onClick"> {
    onClick?: (e: React.MouseEvent) => void | Promise<void>,
    variant?: WithoutPrivate<Variants>,
    loading?: boolean,
    flex?: number
}

export default (<Variants extends string, ElementProps extends {}>(config: GlideButtonConfig<Variants, ElementProps>) => {
    const glideClassName = `glide-button-${++glideCounter}`;
    const style = new Stylesheet();
    const rule = style.addRule(`.${glideClassName}`, config.style);
    rule.addRule("&:hover:not(.disabled)", config.hoverStyle);
    rule.addRule("&:active:not(.disabled)", config.clickStyle);
    rule.addRule("&.disabled", config.disabledStyle);
    rule.addRule(".loading-wrap", {
        padding: config.loaderPadding
    });
    rule.addRule(".content", { flex: 1 });

    const dependencies: { [variant: string]: string[] } = {}

    if (config.variants) {
        for (const variant of Object.keys(config.variants) as Variants[]) {
            if (variant[0] !== ".") {
                let cur: Variants | undefined = variant;
                while (cur) {
                    dependencies[cur] ??= [];
                    dependencies[cur].push(variant);
                    cur = config.variants[cur].extends
                }
            }
        }

        for (const [variant, variantConfig] of Object.entries<ButtonVariantStyle<Variants>>(config.variants)) {
            const variantRule = rule.addRule(dependencies[variant].map(variant => `&.${variant}`), variantConfig.style);
            variantRule.addRule("&:hover:not(.disabled)", variantConfig.hoverStyle);
            variantRule.addRule("&:active:not(.disabled)", variantConfig.clickStyle);
            variantRule.addRule("&.disabled", variantConfig.disabledStyle);
            if (variantConfig.responsive) {
                for (const { mode, width, ...styles } of variantConfig.responsive) {
                    const mediaRule = style.addMediaRule([{ mode, width }]);
                    const rule = mediaRule.addRule(`.${glideClassName}`);
                    const variantRule = rule.addRule(dependencies[variant].map(variant => `&.${variant}`), styles.style);
                    variantRule.addRule("&:hover:not(.disabled)", styles.hoverStyle);
                    variantRule.addRule("&:active:not(.disabled)", styles.clickStyle);
                    variantRule.addRule("&.disabled", styles.disabledStyle);
                    variantRule.addRule(".loader-wrap", {
                        padding: styles.loaderPadding
                    });
                }
            }
        }
    }

    if (config.responsive) {
        for (const { mode, width, loaderPadding, ...styles } of config.responsive) {
            const mediaRule = style.addMediaRule([{ mode, width }]);
            const rule = mediaRule.addRule(`.${glideClassName}`, styles.style);
            rule.addRule("&:hover:not(.disabled)", styles.hoverStyle);
            rule.addRule("&:active:not(.disabled)", styles.clickStyle);
            rule.addRule("&.disabled", styles.disabledStyle);
            rule.addRule(".loader-wrap", {
                padding: loaderPadding
            });
        }
    }

    style.apply(config.debug);

    return ({
        className,
        variant = config.defaultVariant,
        loading: loadingProp,
        disabled: disabledProp,
        submit,
        onClick,
        flex,
        style,
        linkType,
        to,
        ...props
    }: ButtonProps<Variants> & ElementProps) => {
        const disabledContext = useDisabled();
        const loadingContext = useLoading();
        const [loadingState, setLoadingState] = useState(false);

        const disabled = disabledProp ?? loadingProp  ?? disabledContext ?? loadingContext ?? loadingState;
        const loading = config.loader ? (loadingProp ?? (submit && loadingContext) ?? loadingState ?? false) : false;

        const handleClick = useCallback(async (e: React.MouseEvent) => {
            setLoadingState(true);
            try {
                await onClick?.(e);
            }
            finally {
                setLoadingState(false);
            }
        }, [setLoadingState, onClick]);

        return (
            <Clickable
                className={classNames("glide-button", glideClassName, variant, className, config.className, { loading })}
                disabled={disabled}
                submit={submit}
                onClick={handleClick}
                style={{ flex, ...style }}
                linkType={linkType}
                to={to}
                {...props}
            >
                <div className="content">
                    {config.element ? React.createElement(config.element, { variant, ...props } as unknown as ElementProps) : (props as unknown as {children: React.ReactNode}).children}
                </div>
                <div className="loading-wrap">
                    {config.loader}
                </div>
            </Clickable>
        )
    }
}) as {
    <Variants extends string, ElementProps extends {}>(config: Omit<GlideButtonConfig<Variants, ElementProps>, "element">): React.FC<ButtonProps<Variants> & {children: React.ReactNode}>,
    <Variants extends string, ElementProps extends {}>(config: NonOptional<GlideButtonConfig<Variants, ElementProps>, "element">): React.FC<ButtonProps<Variants> & ElementProps>
}