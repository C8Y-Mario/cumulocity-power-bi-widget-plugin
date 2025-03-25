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
import {Component, Input, isDevMode, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AlertService, gettext} from '@c8y/ngx-components';
import {HttpService} from '../http.service';
import {PowerBIReport, PowerBIReports, PowerBIWorkspace} from '../powerbi.interface';
import {PowerBIService} from '../powerbi.service';

export interface ConfigType {
  powerBIEndPoint: string,
  datahubEndPoint: string,
  embedEndPoint: string,
  workspace?: string,
  report?: PowerBIReport,
  isNavPaneEnabled: boolean,
  isFilterPaneEnabled: boolean
}
@Component({
  selector: 'gp-powerbi-config',
  templateUrl: './gp-powerbi-config.component.html',
  styleUrls: ['./gp-powerbi-config.component.css']
})
export class GpPowerbiConfigComponent implements OnInit {

  @Input() config!: ConfigType
  public workspaces: PowerBIWorkspace[];
  public reports: {[key:string]:PowerBIReports};
  public visibleReports?: PowerBIReports;
  public form: FormGroup;
  public isLoading = false;
  public isAdvancedExpanded = false;
  public error = '';
  constructor(
    private powerbiService: PowerBIService,
    private fb: FormBuilder,
    private alertService: AlertService,
    private http: HttpService
  ) {

  }
  async ngOnInit(): Promise<void> {
    if (this.config.isNavPaneEnabled == null) {
      this.config.isNavPaneEnabled = false;
    }
    if (this.config.isFilterPaneEnabled == null) {
      this.config.isFilterPaneEnabled = false;
    }
    if (this.config.powerBIEndPoint === '' || this.config.powerBIEndPoint === undefined) {
      this.config.powerBIEndPoint = '/powerbi';
    } else {
      if (isDevMode()) { console.log(this.config.powerBIEndPoint); }
    }
    if (this.config.datahubEndPoint === '' || this.config.datahubEndPoint === undefined) {
      this.config.datahubEndPoint = '/service/datahub';
    } else {
      if (isDevMode()) { console.log(this.config.datahubEndPoint); }
    }
    if (this.config.embedEndPoint === '' || this.config.embedEndPoint === undefined) {
      this.config.embedEndPoint = 'https://app.powerbi.com/reportEmbed';
    } else {
      if (isDevMode()) { console.log(this.config.embedEndPoint); }
    }
    this.form = this.fb.group({
      connection: this.fb.group({
        powerBIEndPoint: this.fb.control(this.config.powerBIEndPoint, Validators.required),
        datahubEndPoint: this.fb.control(this.config.datahubEndPoint, Validators.required),
        embedEndPoint: this.fb.control(this.config.embedEndPoint, Validators.required)
      }),
      isFilterEnabled: this.fb.control(this.config.isFilterPaneEnabled),
      isNavPaneEnabled: this.fb.control(this.config.isNavPaneEnabled),
      workspace: this.fb.control(null, Validators.required),
      report: this.fb.control(null, Validators.required)
    });
    this.workspaces = [];
    this.reports = {};
    await this.setUrlAndGetWorkspace();
  }

  // If user updates datahub or PowerBI url
  // then use that and update the path in http service and powerbi service
  // and fetch list of workspaces and reports available if any
  async setUrlAndGetWorkspace(): Promise<void> {
    if (isDevMode()) {
      console.log('setUrlAndGetWorkspace Config URL', this.config.powerBIEndPoint, this.config, this.config.datahubEndPoint);
    }
    this.http.path = this.config.datahubEndPoint;
    this.powerbiService.path = this.config.powerBIEndPoint;
    await this.getReport();
  }

  // fetch the exisiting selected value of workspace and report if available
  // and list of workspaces and reports available if any
  async getReport(): Promise<any> {
    try {
       await this.powerbiService.getConfig();
    } catch (e) {
      this.alertService.danger('Cannot find the Path');
    }

    this.workspaces = await this.powerbiService.listWorkspaces();
    // If workspace length is zero then show error message
    if (this.workspaces.length === 0) {
      this.alertService.danger('Cannot select report because no workspaces are available.');
    } else {
      await this.fetchReportsForFirstWorkspaceAndShow();
      this.initForm();
    }
  }

  // Show the selected value in form and update the values selected in config
  // workspace and report
  initForm(): any {
    const selectedWorkspace: string = this.config.workspace ?? this.workspaces[0]?.id;
    this.config.workspace = selectedWorkspace;
    let powerBIWorkspace = this.workspaces.find((workspace) => workspace.id === selectedWorkspace);
    if (selectedWorkspace && powerBIWorkspace) {
      this.form.controls['workspace'].setValue(powerBIWorkspace);
      this.visibleReports = this.reports[selectedWorkspace];
      if (this.config.report && this.reports[selectedWorkspace].find((report) => report.id === this.config.report?.id)) {
        this.form.controls['report'].setValue(this.config.report)
      }
    }

    this.form.controls["workspace"].valueChanges.subscribe(async (workspaceValue: PowerBIWorkspace) => {
      const workspaceId = workspaceValue.id;
      try {
        this.error = '';
        this.isLoading = true;
        this.reports[workspaceId] = await this.powerbiService.listReports(workspaceId);
        if (this.reports[workspaceId].length > 0) {
          this.form.controls["report"].setValue(this.reports[workspaceId][0]);
        } else {
          this.form.controls["report"].setValue(null);
        }
        this.visibleReports = this.reports[workspaceId];
        this.config.workspace = this.form.controls["workspace"].value;
      } catch (e) {
        this.error = 'Fetching reports for workspace failed.';
      } finally {
        this.isLoading = false;
      }
    });
    // Form change on report selection
    this.form.controls["report"].valueChanges.subscribe((reportValue: PowerBIReport) => {
      this.config.report = reportValue;
    });
    this.form.controls["isFilterEnabled"].valueChanges.subscribe((newValue) => {
      this.config.isFilterPaneEnabled = newValue;
    });
    this.form.controls["isNavPaneEnabled"].valueChanges.subscribe((newValue) => {
      this.config.isNavPaneEnabled = newValue;
    })
    this.form.controls["connection"].valueChanges.subscribe((value) => {
      this.config.datahubEndPoint = value.datahubEndPoint;
      this.config.embedEndPoint = value.embedEndPoint;
      this.config.powerBIEndPoint = value.powerBIEndPoint;
    })
  }

  // Fetch the Reports for Workspace and show those
  private async fetchReportsForFirstWorkspaceAndShow(): Promise<void> {
    try {
      // If workspace are available, then fetch reports and populate dropdown
      const workspaceId = this.config.workspace ?? this.workspaces[0]?.id;
      if (workspaceId) {
        this.reports[workspaceId] = await this.powerbiService.listReports(workspaceId);
      }
    }
    catch (e: any) {
      const msg = gettext('An error occurred while fetching reports of workspace {{workspaceName}}. Try again. ' + e);
      this.alertService.danger(msg, this.workspaces[0].name);
    }
  }

  byId(a: any, b: any): boolean {
    return a?.id == b?.id
  }
}
