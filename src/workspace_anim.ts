import Clutter from 'gi://Clutter';
import * as WorkspaceAnimation from 'resource:///org/gnome/shell/ui/workspaceAnimation.js';

import { should_retime_switch, type Curve } from './anim_math.js';

const MODES: Record<Curve, number> = {
    'ease-out-cubic': Clutter.AnimationMode.EASE_OUT_CUBIC,
    'ease-out-expo': Clutter.AnimationMode.EASE_OUT_EXPO,
};

/**
 * GNOME hard-codes the workspace slide timing in animateSwitch(); each monitor
 * group eases its 'progress' property. Retime keyboard switches (GNOME's default
 * duration) to yatm's duration/curve; leave gesture-driven switches alone.
 */
export function retime_workspace_switch(ext: { inject(o: any, m: string, f: any): void; settings: any }): void {
    const proto = (WorkspaceAnimation as any).MonitorGroup.prototype;
    const original = proto.ease_property;
    const gnome_default = (WorkspaceAnimation as any).WINDOW_ANIMATION_TIME;

    ext.inject(proto, 'ease_property', function (this: any, name: string, value: any, params: any) {
        if (
            name === 'progress' &&
            ext.settings.animations_active() &&
            ext.settings.animate_workspace() &&
            should_retime_switch(params?.duration, gnome_default)
        ) {
            params = {
                ...params,
                duration: ext.settings.animation_duration(),
                mode: MODES[ext.settings.animation_curve() as Curve],
            };
        }
        return original.call(this, name, value, params);
    });
}
