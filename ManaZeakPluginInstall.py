#!/usr/bin/env python3


# Python imports
import os
import sys
import shutil
import argparse
# Globals
global pluginVersion
pluginVersion = '0.8.1'


# To install this plugin, refer to ManaZeak wiki (https://github.com/ManaZeak/ManaZeak/wiki)
# ManaZeakPluginIntall script
# Script to install MzkVisualizer into ManaZeak (https://github.com/ManaZeak/ManaZeak)

# It needs either -i (install), -p (pull) or -u (uninstall) flags to manipulate plugin, in addition with
# the ManaZeak 'static/' folder and will copy all MzkVisualizer assets to static/plugins/MzkVisualizer/,
# with static being the given path. This way, it makes all images available for MzkVisualizer Js module
# without any nginx modification. MzkVisualizer javascript and css codes aren't copied, as their bundling
# is handled in ManaZeak, in the webpack configuration.
# @author Arthur Beaulieu - https://github.com/ArthurBeaulieu


def main():
    print('> ManaZeakPluginInstall for MzkVisualizer - Version {}'.format(pluginVersion))
    # Init argparse arguments
    ap = argparse.ArgumentParser()
    ap.add_argument('staticpath', help='The destination folder to install plugin assets in')
    # Install/Desinstall modes
    ap.add_argument('-i', '--install', help='Install plugin in given path', action='store_true')
    ap.add_argument('-u', '--uninstall', help='Uninstall plugin in given path', action='store_true')
    ap.add_argument('-p', '--pull', help='Update plugin to the latest master commit', action='store_true')
    args = vars(ap.parse_args())
    # Preventing path from missing its trailing slash
    if not args['staticpath'].endswith('/'):
        print('The path \'{}\' is invalid\n> Exiting installer'.format(args['staticpath']))
        sys.exit(-1)
    # Handle install/uninstall plugin
    if args['install']:
        print('Install MzkVisualizer plugin...')
        installPlugin(args['staticpath'])
        print('Installation complete in \'{}plugins/MzkVisualizer/\''.format(args['staticpath']))
    elif args['uninstall']:
        print('Uninstall MzkVisualizer plugin...')
        uninstallPlugin(args['staticpath'])
        print('Uninstallation complete in \'{}\''.format(args['staticpath']))
    elif args['pull']:
        print('Update MzkVisualizer plugin...')
        installPlugin(args['staticpath'])
        print('Update complete in \'{}\''.format(args['staticpath']))
    else:
        print('Missing arguments. See --help')


# Install MzkVisualizer plugin in path
def installPlugin(staticpath):
    # Removing any previous existing
    print('> Remove any previous MzkVisualizer installation')
    removePluginAssets(staticpath)
    # Start assets copy
    print('> Copying MzkVisualizer assets to \'{}\''.format(staticpath))
    addPluginAssets(staticpath)


# Uninstall MzkVisualizer plugin in path
def uninstallPlugin(staticpath):
    # Removing any previous existing
    print('> Remove MzkVisualizer assets in \'{}plugins/MzkVisualizer/\''.format(staticpath))
    removePluginAssets(staticpath)


# Copy MzkVisualizer assets to 'staticpath/plugins/MzkWorldMap'
def addPluginAssets(staticpath):
    try: # Try to copy MzkVisualizer assets directory into argPath/plugins/MzkVisualizer
        shutil.copytree('plugins/MzkVisualizer/assets/', '{}plugins/MzkVisualizer/'.format(staticpath))
    except OSError as error:
        print('{}'.format(error))
        sys.exit(-1)


# Delete folder 'plugins/MzkVisualizer' and all files in path
def removePluginAssets(staticpath):
    # Do not rm 'plugins', as there could be other plugins installed on instance
    if os.path.isdir('{}plugins/MzkVisualizer/'.format(staticpath)):
        shutil.rmtree('{}plugins/MzkVisualizer/'.format(staticpath))


# Script start point
if __name__ == '__main__':
    main()
