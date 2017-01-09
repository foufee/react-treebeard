'use strict';

import React from 'react';
import {VelocityTransitionGroup} from 'velocity-react';
import interact from 'interact.js';
import NodeHeader from './header';

class TreeNode extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            interactMounted: false
        };
        this.onClick = this.onClick.bind(this);
    }

    componentWillReceiveProps() {
        this.mountInteract();
    }

    dragMoveListener(event) {
        var target = event.target,
            // keep the dragged position in the data-x/data-y attributes
            x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
            y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        // translate the element
        target.style.webkitTransform =
            target.style.transform =
                'translate(' + x + 'px, ' + y + 'px)';

        // update the posiion attributes
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
        if (this.props.dragAndDrop.onMove !== undefined) {
            this.props.dragAndDrop.onMove(event);
        }
    }

    mountInteract() {
        if (!this.state.interactMounted) {
            interact(this.refs.topLevel)
                .draggable({
                    // enable inertial throwing
                    inertia: true,
                    autoScroll: true,
                    // call this function on every dragmove event
                    onmove: (event) => { this.dragMoveListener(event); },
                    onend: (event) => { this.props.dragAndDrop.onEnd(event); }
                });
            this.setState({interactMounted: true});
        }
    }

    onClick(){
        let toggled = !this.props.node.toggled;
        let onToggle = this.props.onToggle;
        if(onToggle){ onToggle(this.props.node, toggled); }
    }
    animations(){
        const props = this.props;
        if(props.animations === false){ return false; }
        let anim = Object.assign({}, props.animations, props.node.animations);
        return {
            toggle: anim.toggle(this.props),
            drawer: anim.drawer(this.props)
        };
    }
    decorators(){
        // Merge Any Node Based Decorators Into The Pack
        const props = this.props;
        let nodeDecorators = props.node.decorators || {};
        return Object.assign({}, props.decorators, nodeDecorators);
    }
    render(){
        const decorators = this.decorators();
        const animations = this.animations();
        console.log(this.props);
        return (
            <li style={this.props.style.base} ref="topLevel" className={this.props.dragAndDrop.nodeSelector}>
                {this.renderHeader(decorators, animations)}
                {this.renderDrawer(decorators, animations)}
            </li>
        );
    }
    renderDrawer(decorators, animations){
        const toggled = this.props.node.toggled;
        if(!animations && !toggled){ return null; }
        if(!animations && toggled){
            return this.renderChildren(decorators, animations);
        }
        return (
            <VelocityTransitionGroup {...animations.drawer} ref="velocity">
                {toggled ? this.renderChildren(decorators, animations) : null}
            </VelocityTransitionGroup>
        );
    }
    renderHeader(decorators, animations){
        return (
            <NodeHeader
                // ref={(input) => {this.node = input;}}
                decorators={decorators}
                animations={animations}
                style={this.props.style}
                node={Object.assign({}, this.props.node)}
                onClick={this.onClick}
            />
        );
    }
    renderChildren(decorators){
        if(this.props.node.loading){ return this.renderLoading(decorators); }
        let children = this.props.node.children;
        if (!Array.isArray(children)) { children = children ? [children] : []; }
        return (
            <ul style={this.props.style.subtree} ref="subtree">
                {children.map((child, index) =>
                    <TreeNode
                        {...this._eventBubbles()}
                        key={child.id || index}
                        node={child}
                        decorators={this.props.decorators}
                        animations={this.props.animations}
                        style={this.props.style}
                        dragAndDrop={this.props.dragAndDrop}
                    />
                )}
            </ul>
        );
    }
    renderLoading(decorators){
        return (
            <ul style={this.props.style.subtree}>
                <li>
                    <decorators.Loading style={this.props.style.loading}/>
                </li>
            </ul>
        );
    }
    _eventBubbles(){
        return { onToggle: this.props.onToggle };
    }
}

TreeNode.propTypes = {
    style: React.PropTypes.object.isRequired,
    node: React.PropTypes.object.isRequired,
    decorators: React.PropTypes.object.isRequired,
    animations: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.bool
    ]).isRequired,
    onToggle: React.PropTypes.func,
    dragAndDrop: React.PropTypes.object
};

export default TreeNode;
