import React, { Component, PropTypes } from 'react';
import {
  StyleSheet,
  Dimensions,
  Platform,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { filter, some, includes } from 'lodash/collection';
import { debounce } from 'lodash/function';

const INITIAL_TOP = Platform.OS === 'ios' ? -80 : -60;

export default class Search extends Component {

  static propTypes = {
    data: PropTypes.array,
    placeholder: PropTypes.string,
    handleChangeText: PropTypes.func,
    handleSearch: PropTypes.func,
    handleResults: PropTypes.func,
    onHide: PropTypes.func,
    onBack: PropTypes.func,
    heightAdjust: PropTypes.number,
    backgroundColor: PropTypes.string,
    iconColor: PropTypes.string,
    textColor: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    showOnLoad: PropTypes.bool,
    hideBack: PropTypes.bool,
    hideX: PropTypes.bool,
    iOSPadding: PropTypes.bool,
    clearOnShow: PropTypes.bool,
    clearOnHide: PropTypes.bool,
    focusOnLayout: PropTypes.bool,
    autoCorrect: PropTypes.bool
  }

  static defaultProps = {
    data: [],
    placeholder: 'Search',
    heightAdjust: 0,
    backgroundColor: 'white',
    iconColor: 'gray',
    textColor: 'gray',
    placeholderTextColor: 'lightgray',
    animate: true,
    animationDuration: 200,
    showOnLoad: false,
    hideBack: false,
    hideX: false,
    iOSPadding: true,
    clearOnShow: false,
    clearOnHide: true,
    focusOnLayout: true,
    autoCorrect: true,
  }

  constructor(props) {
    super(props);
    this.state = {
      input: '',
      show: props.showOnLoad,
      top: new Animated.Value(props.showOnLoad ? 0 : INITIAL_TOP + props.heightAdjust),
    };

    this.hide = this.hide.bind(this);
    this._doHide = this._doHide.bind(this);
    this._onChangeText = this._onChangeText.bind(this);
    this._internalSearch = this._internalSearch.bind(this);
    this._clearInput = this._clearInput.bind(this);
  }

  show() {
    const { animate, animationDuration, clearOnShow } = this.props;
    if (clearOnShow) {
      this.setState({ input: '' })
    }
    this.setState({ show: true });
    if (animate) {
      Animated.timing(
        this.state.top, {
            toValue: 0,
            duration: animationDuration,
        }
      ).start();
    } else {
      this.setState({ top: new Animated.Value(0) })
    }
  }

  hide() {
    const { onHide, animate, animationDuration } = this.props;
    if (onHide) {
      onHide(this.state.input);
    }
    if (animate) {
      Animated.timing(
        this.state.top, {
            toValue: INITIAL_TOP,
            duration: animationDuration,
        }
      ).start();
      setTimeout(() => {
        this._doHide();
      }, animationDuration)
    } else {
      this.setState({ top: new Animated.Value(INITIAL_TOP) })
      this._doHide()
    }
  }

  _doHide() {
    const { clearOnHide } = this.props;
    this.setState({ show: false });
    if (clearOnHide) {
      this.setState({ input: '' });
    }
  }

  _onChangeText(input) {
    const { handleChangeText, handleSearch, handleResults } = this.props;
    this.setState({ input });
    if (handleChangeText) {
      handleChangeText(input);
    }
    if (handleSearch) {
      handleSearch(input);
    } else {
      debounce(() => {
        // use internal search logic (depth first)!
        if (handleResults) {
          const results = this._internalSearch(input);
          handleResults(results);
        }
      }, 500)();
    }
  }

  _internalSearch(input) {
    if (input === '') {
      return [];
    }
    return filter(this.props.data, (item) => {
      return this._depthFirstSearch(item, input)
    });
  }

  _depthFirstSearch(collection, input) {
    // let's get recursive boi
    let type = typeof collection;
    // base case(s)
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return includes(collection.toString().toLowerCase(), input.toString().toLowerCase());
    }
    return some(collection, (item) => this._depthFirstSearch(item, input));
  }

  _clearInput() {
    this.setState({ input: '' });
    this._onChangeText('');
  }

  render() {
    const { placeholder, heightAdjust, backgroundColor, iconColor, textColor, placeholderTextColor, onBack, hideBack, hideX, iOSPadding } = this.props;
    return (
      <Animated.View style={[styles.container, { top: this.state.top }]}>
        {
          this.state.show &&
          <View style={[styles.navWrapper, { backgroundColor }]} >
            {  Platform.OS === 'ios' && iOSPadding && <View style={{ height: 20 }} /> }
            <View style={[
                styles.nav,
                { height: (Platform.OS === 'ios' ? 52 : 62) + heightAdjust },
              ]}
            >
              {
                !hideBack &&
                <TouchableOpacity onPress={onBack || this.hide}>
                  <Icon
                    name='arrow-back'
                    size={28}
                    style={{
                      color: iconColor,
                      padding: heightAdjust / 2 + 10
                    }}
                  />
                </TouchableOpacity>
              }
              <TextInput
                ref={(ref) => this.textInput = ref}
                onLayout={() => this.props.focusOnLayout && this.textInput.focus()}
                style={[
                  styles.input,
                  {
                    color: textColor, marginLeft: hideBack ? 5 : 0,
                    marginTop: (Platform.OS === 'ios' ? heightAdjust / 2 + 10 : 0)
                  }
                ]}
                onChangeText={(input) => this._onChangeText(input)}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                value={this.state.input}
                underlineColorAndroid='transparent'
                returnKeyType='search'
                autoCorrect={this.props.autoCorrect}
              />
            <TouchableOpacity onPress={hideX || this.state.input === '' ? null : this._clearInput}>
                  <Icon
                    name={'close'}
                    size={28}
                    style={{
                      color: hideX || this.state.input == '' ? backgroundColor : iconColor,
                      padding: heightAdjust / 2 + 10
                    }}
                  />
              </TouchableOpacity>
            </View>
          </View>
        }
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 10,
    position: 'absolute'
  },
  navWrapper: {
    width: Dimensions.get('window').width,
  },
  nav: {
    ...Platform.select({
        android: {
          borderBottomColor: 'lightgray',
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
    }),
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  input: {
    ...Platform.select({
        ios: { height: 30 },
        android: { height: 50 },
    }),
    width: Dimensions.get('window').width - 120,
    fontSize: 20,
  }
});
