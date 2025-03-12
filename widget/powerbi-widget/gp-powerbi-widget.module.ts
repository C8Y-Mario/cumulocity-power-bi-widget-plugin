/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {NgModule} from '@angular/core';
import {CoreModule, FormsModule as c8yFormsModule, hookComponent} from '@c8y/ngx-components';
import {GpPowerbiWidgetComponent} from './gp-powerbi-widget.component';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {GpPowerbiConfigComponent} from './gp-powerbi-config/gp-powerbi-config.component';
import * as preview from './preview-image';

@NgModule({
  declarations: [GpPowerbiWidgetComponent, GpPowerbiConfigComponent],
  imports: [
    CoreModule, CollapseModule, RouterModule, c8yFormsModule, ReactiveFormsModule
  ],
  providers: [
    hookComponent({
        id: 'powerbi.widget',
        label: 'Power BI Widget',
        description: 'Display Power BI Reports created from DataHub',
        previewImage: preview.previewImage,
        component: GpPowerbiWidgetComponent,
        configComponent: GpPowerbiConfigComponent,
        data: {
          ng1: {
            options: {
              noDeviceTarget: true,
              noNewWidgets: false,
              deviceTargetNotRequired: true,
              groupsSelectable: true
            },
          }
        }
    })],
  exports: [GpPowerbiWidgetComponent, GpPowerbiConfigComponent]
})
export class GpPowerbiWidgetModule { }
